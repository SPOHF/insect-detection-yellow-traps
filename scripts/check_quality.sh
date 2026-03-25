#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

echo "[1/3] Python compile checks"
cd "$ROOT_DIR"
python3 -m compileall apps/backend/app src

echo "[2/3] Frontend build checks"
cd "$ROOT_DIR/apps/frontend"
npm run build

echo "[3/3] Backend pytest checks"
cd "$ROOT_DIR/apps/backend"
if [[ -x ".venv/bin/python" ]]; then
  if .venv/bin/python -c "import pytest" >/dev/null 2>&1; then
    .venv/bin/python -m pytest -q
  else
    echo "Skipping backend pytest: pytest is not installed in apps/backend/.venv"
  fi
else
  echo "Skipping backend pytest: apps/backend/.venv/bin/python not found"
fi

echo "Quality checks completed."
