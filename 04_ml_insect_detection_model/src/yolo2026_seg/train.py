from __future__ import annotations

import shutil
from pathlib import Path
from typing import Any

from .config import TrainConfig
from .data import build_group_folds, load_train_samples, write_fold_dataset_yaml, write_fold_manifest
from .eval import summarize_folds
from .model import build_model
from .utils import dump_json, ensure_dir, set_seed, to_float


def _extract_metrics(results: Any) -> dict[str, float]:
    metrics = getattr(results, "results_dict", {}) or {}
    return {
        "map50": to_float(metrics.get("metrics/mAP50(B)")),
        "map50_95": to_float(metrics.get("metrics/mAP50-95(B)")),
        "precision": to_float(metrics.get("metrics/precision(B)")),
        "recall": to_float(metrics.get("metrics/recall(B)")),
        "seg_map50": to_float(metrics.get("metrics/mAP50(M)")),
        "seg_map50_95": to_float(metrics.get("metrics/mAP50-95(M)")),
    }


def run_training(cfg: TrainConfig) -> dict[str, Any]:
    set_seed(cfg.cv.seed)

    run_root = ensure_dir(cfg.project / cfg.name)
    split_root = ensure_dir(run_root / "splits")

    samples, names = load_train_samples(cfg.data_yaml, group_delimiter=cfg.cv.group_delimiter)
    folds = build_group_folds(samples, folds=cfg.cv.folds, seed=cfg.cv.seed)
    write_fold_manifest(run_root / "fold_manifest.json", folds)

    fold_metrics: list[dict[str, float]] = []
    best_fold_idx = -1
    best_metric = float("-inf")
    best_weights: Path | None = None

    for fold_idx, split in enumerate(folds, start=1):
        fold_data_yaml = write_fold_dataset_yaml(
            out_dir=split_root,
            fold_idx=fold_idx,
            split=split,
            names=names,
        )
        fold_run_name = f"{cfg.name}_fold{fold_idx}"

        model = build_model(cfg.model)
        model.train(
            data=str(fold_data_yaml),
            task="segment",
            imgsz=cfg.imgsz,
            epochs=cfg.epochs,
            batch=cfg.batch,
            lr0=cfg.lr0,
            device=cfg.device or None,
            workers=cfg.workers,
            patience=cfg.patience,
            project=str(cfg.project),
            name=fold_run_name,
            exist_ok=True,
            val=True,
            plots=False,
            seed=cfg.cv.seed,
        )

        fold_dir = cfg.project / fold_run_name
        val_model = build_model(str(fold_dir / "weights" / "best.pt"))
        val_results = val_model.val(data=str(fold_data_yaml), task="segment", device=cfg.device or None)
        fm = _extract_metrics(val_results)
        fold_metrics.append(fm)

        score = fm.get(cfg.cv.primary_metric, 0.0)
        if score > best_metric:
            best_metric = score
            best_fold_idx = fold_idx
            best_weights = fold_dir / "weights" / "best.pt"

    if best_weights is None:
        raise RuntimeError("Training finished without a best weights file")

    cfg.export_best_to.parent.mkdir(parents=True, exist_ok=True)
    shutil.copy2(best_weights, cfg.export_best_to)

    summary = summarize_folds(fold_metrics, primary_metric=cfg.cv.primary_metric)
    summary["best_fold"] = best_fold_idx
    summary["best_metric_value"] = best_metric
    summary["best_model_path"] = str(cfg.export_best_to)

    dump_json(run_root / "cv_summary.json", summary)
    return summary
