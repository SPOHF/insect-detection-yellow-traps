from __future__ import annotations

from dataclasses import dataclass, field
from pathlib import Path
from typing import Any

import yaml


@dataclass
class CVConfig:
    enabled: bool = True
    folds: int = 5
    seed: int = 42
    group_delimiter: str = "__"
    primary_metric: str = "map50_95"


@dataclass
class TrainConfig:
    # Input
    data_yaml: Path
    model: str = "yolo11s.pt"
    task: str = "detect"

    # Process
    project: Path = Path("runs/train")
    name: str = "swd_yolo_detect"
    imgsz: int = 1500
    epochs: int = 100
    batch: int = 8
    lr0: float = 0.001
    device: str = ""
    workers: int = 8
    patience: int = 100
    optimizer: str = "auto"
    cos_lr: bool = True
    close_mosaic: int = 10
    single_cls: bool = True

    # Cross-validation
    cv: CVConfig = field(default_factory=CVConfig)

    # Output
    export_best_to: Path = Path("04_ml_insect_detection_model/weights/swd_yolo_best.pt")


@dataclass
class EvalConfig:
    train_run_dir: Path = Path("runs/train/yolo2026_seg")
    primary_metric: str = "map50_95"


@dataclass
class InferConfig:
    # Input
    model_path: Path
    source: Path
    task: str = "detect"

    # Process
    imgsz: int = 1024
    conf: float = 0.25
    iou: float = 0.50
    max_det: int = 300
    device: str = ""

    # Output
    out_dir: Path = Path("runs/infer")
    save_vis: bool = True


def _read_yaml(path: Path) -> dict[str, Any]:
    with path.open("r", encoding="utf-8") as f:
        data = yaml.safe_load(f)
    if not isinstance(data, dict):
        raise ValueError(f"Config must be a mapping: {path}")
    return data


def _as_bool(value: Any) -> bool:
    if isinstance(value, bool):
        return value
    if isinstance(value, str):
        normalized = value.strip().lower()
        if normalized in {"1", "true", "yes", "on"}:
            return True
        if normalized in {"0", "false", "no", "off"}:
            return False
    return bool(value)


def load_train_config(path: str | Path) -> TrainConfig:
    raw = _read_yaml(Path(path))
    cv_raw = raw.get("cross_validation", {}) or {}

    data_yaml = raw.get("data_yaml")
    if not data_yaml:
        raise ValueError("train config missing: data_yaml")

    cfg = TrainConfig(
        data_yaml=Path(data_yaml),
        model=str(raw.get("model_architecture", "yolo11s.pt")),
        task=str(raw.get("task", "detect")),
        project=Path(raw.get("project", "runs/train")),
        name=str(raw.get("experiment_name", "swd_yolo_detect")),
        imgsz=int(raw.get("img_size", 1024)),
        epochs=int(raw.get("epochs", 100)),
        batch=int(raw.get("batch_size", 8)),
        lr0=float(raw.get("learning_rate", 0.001)),
        device=str(raw.get("device", "")),
        workers=int(raw.get("workers", 8)),
        patience=int(raw.get("patience", 100)),
        optimizer=str(raw.get("optimizer", "auto")),
        cos_lr=_as_bool(raw.get("cos_lr", True)),
        close_mosaic=int(raw.get("close_mosaic", 10)),
        single_cls=_as_bool(raw.get("single_cls", True)),
        cv=CVConfig(
            enabled=_as_bool(cv_raw.get("enabled", True)),
            folds=int(cv_raw.get("folds", 5)),
            seed=int(cv_raw.get("seed", 42)),
            group_delimiter=str(cv_raw.get("group_delimiter", "__")),
            primary_metric=str(cv_raw.get("selection_metric", "map50_95")),
        ),
        export_best_to=Path((raw.get("outputs") or {}).get("best_model_path", "04_ml_insect_detection_model/weights/swd_yolo_best.pt")),
    )

    if cfg.task not in {"detect", "segment"}:
        raise ValueError("task must be one of: detect, segment")
    if cfg.cv.folds < 2:
        raise ValueError("cross_validation.folds must be >= 2")
    return cfg


def load_eval_config(path: str | Path) -> EvalConfig:
    raw = _read_yaml(Path(path))
    return EvalConfig(
        train_run_dir=Path(raw.get("train_run_dir", "runs/train/yolo2026_seg")),
        primary_metric=str(raw.get("primary_metric", "map50_95")),
    )


def load_infer_config(path: str | Path) -> InferConfig:
    raw = _read_yaml(Path(path))
    model_path = raw.get("model_path")
    source = (raw.get("inputs") or {}).get("source_dir")
    if not model_path:
        raise ValueError("infer config missing: model_path")
    if not source:
        raise ValueError("infer config missing: inputs.source_dir")

    outputs = raw.get("outputs") or {}
    cfg = InferConfig(
        model_path=Path(model_path),
        source=Path(source),
        task=str(raw.get("task", "detect")),
        imgsz=int(raw.get("img_size", 1024)),
        conf=float(raw.get("confidence_threshold", 0.25)),
        iou=float(raw.get("iou_threshold", 0.5)),
        max_det=int(raw.get("max_detections", 300)),
        device=str(raw.get("device", "")),
        out_dir=Path(outputs.get("output_dir", "runs/infer")),
        save_vis=_as_bool(outputs.get("save_visualizations", True)),
    )
    if cfg.task not in {"detect", "segment"}:
        raise ValueError("task must be one of: detect, segment")
    return cfg
