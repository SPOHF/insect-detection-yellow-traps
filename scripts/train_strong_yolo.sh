#!/usr/bin/env bash
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$REPO_ROOT"

PYTHON_BIN="${PYTHON_BIN:-.venv/bin/python}"
CONFIG_PATH="${CONFIG_PATH:-configs/yolo.yaml}"
PROJECT="${PROJECT:-insect_yellow}"
APPROACH="${APPROACH:-yolo}"

echo "[1/4] Preparing YOLO dataset..."
"$PYTHON_BIN" -m src.cli prepare-data --project "$PROJECT" --approach "$APPROACH" --config "$CONFIG_PATH"

echo "[2/4] Training strong YOLO configuration..."
"$PYTHON_BIN" -m src.cli train --project "$PROJECT" --approach "$APPROACH" --config "$CONFIG_PATH"

LATEST_RUN="$(ls -1dt runs/${PROJECT}/${APPROACH}/* | head -n 1)"
BEST_WEIGHTS="${LATEST_RUN}/train/weights/best.pt"
if [[ ! -f "$BEST_WEIGHTS" ]]; then
  echo "ERROR: best weights not found at $BEST_WEIGHTS"
  exit 1
fi

echo "[3/4] Evaluating best checkpoint..."
"$PYTHON_BIN" -m src.cli evaluate --project "$PROJECT" --approach "$APPROACH" --config "$CONFIG_PATH"

echo "[4/4] Publishing model artifacts for backend..."
cp "$BEST_WEIGHTS" apps/poc-model/swd_yolo_best.pt
echo "Copied: $BEST_WEIGHTS -> apps/poc-model/swd_yolo_best.pt"
echo "Metrics should be at: apps/poc-model/model_metrics.json"

echo "Done. Restart backend if needed to refresh model stats in UI."
