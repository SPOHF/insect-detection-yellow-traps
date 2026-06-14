from __future__ import annotations

import json
from pathlib import Path

import typer

from yolo2026_seg.config import load_eval_config, load_infer_config, load_train_config
from yolo2026_seg.eval import save_eval_report
from yolo2026_seg.infer import run_inference
from yolo2026_seg.train import run_training

app = typer.Typer(add_completion=False, help="YOLO insect detection and segmentation CLI")


@app.command("train")
def train(config: Path = typer.Option(..., "--config", "-c", exists=True)) -> None:
    """Run K-fold training and export best checkpoint."""
    cfg = load_train_config(config)
    summary = run_training(cfg)
    typer.echo(f"Done. best_fold={summary['best_fold']} best_metric={summary['best_metric_value']:.5f}")


@app.command("eval")
def evaluate(config: Path = typer.Option(..., "--config", "-c", exists=True)) -> None:
    """Copy CV summary into a stable eval report path."""
    cfg = load_eval_config(config)
    summary_path = cfg.train_run_dir / "cv_summary.json"
    if not summary_path.exists():
        raise typer.BadParameter(f"Missing summary file: {summary_path}")
    payload = json.loads(summary_path.read_text(encoding="utf-8"))
    report_path = cfg.train_run_dir / "eval_summary.json"
    save_eval_report(report_path, payload)
    typer.echo(str(report_path))


@app.command("infer")
def infer(config: Path = typer.Option(..., "--config", "-c", exists=True)) -> None:
    """Run prediction and write JSON outputs."""
    cfg = load_infer_config(config)
    out = run_inference(cfg)
    typer.echo(str(out))


if __name__ == "__main__":
    app()
