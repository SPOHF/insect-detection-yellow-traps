from __future__ import annotations

from pathlib import Path
from typing import Any

from .utils import dump_json, metric_row


def summarize_folds(fold_metrics: list[dict[str, float]], primary_metric: str) -> dict[str, Any]:
    keys = sorted({k for fm in fold_metrics for k in fm.keys()})
    rows = []
    for k in keys:
        vals = [fm.get(k, 0.0) for fm in fold_metrics]
        rows.append(metric_row(k, vals))

    best_fold = max(
        range(len(fold_metrics)),
        key=lambda i: fold_metrics[i].get(primary_metric, 0.0),
    ) if fold_metrics else -1

    return {
        "primary_metric": primary_metric,
        "best_fold": best_fold + 1 if best_fold >= 0 else None,
        "summary": rows,
        "fold_metrics": fold_metrics,
    }


def save_eval_report(path: Path, payload: dict[str, Any]) -> None:
    dump_json(path, payload)
