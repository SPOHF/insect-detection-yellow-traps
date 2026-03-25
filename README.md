# SWD Insect Monitoring Platform

End-to-end local platform for monitoring *Drosophila suzukii* on yellow sticky traps.

## Instructions

Use this quick sequence to set everything up from scratch.

### 1) Prerequisites

- Docker Desktop (or Docker Engine + Compose)
- Python `3.11+`
- Node.js `18+` (recommended `20+`)
- npm

### 2) Clone and open the project

```bash
git clone git@github.com:SPOHF/insect-detection-yellow-traps.git
cd insect-detection-yellow-traps
```

### 3) Start databases

```bash
docker compose up -d postgres neo4j
```

### 4) Configure and start backend

```bash
cd apps/backend
cp .env.example .env
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
./scripts/start.sh
```

Backend runs on: `http://localhost:8000`
API docs: `http://localhost:8000/docs`

Default seeded admin:
- Email: `admin@swd-monitoring.com`
- Password: `Admin123ChangeMe`

### 5) Configure and start frontend

Open a second terminal:

```bash
cd apps/frontend
cp .env.example .env
npm install
npm run dev
```

Frontend runs on: `http://localhost:5173`

### 6) First-use flow in the app

1. Log in
2. Create/select a field
3. Upload trap images
4. Open Analytics and Exploratory Analysis

### 7) Data safety (important)

- Keep raw data in `data/raw/...`
- Raw data is ignored by git (`data/raw/`, `data/**/2024/`, `data/**/2025/`)
- Use sync script to mirror local data folders safely:

```bash
./scripts/sync_brightlands_data.sh
```

## Contribution and Standards

- [Contributing Guide](CONTRIBUTING.md)
- [Code of Conduct](CODE_OF_CONDUCT.md)
- [Security Policy](SECURITY.md)
- [Repository Standards](docs/standards/repository.md)
- [Python Standards](docs/standards/python.md)
- [TypeScript Standards](docs/standards/typescript.md)

Quick quality gate before committing:

```bash
./scripts/check_quality.sh
```

This repository contains:
- A CV training pipeline (YOLO, RT-DETR, classical baseline)
- A full-stack web app (React + FastAPI)
- PostgreSQL (auth/data), Neo4j (field graph), model inference, analytics, and reports

## What is in this repo

- `apps/frontend`
  React/Vite UI for login, map-based fields/traps, uploads, analytics, and exploratory reports
- `apps/backend`
  FastAPI API with JWT auth, uploads/inference, analytics, environment sync, report generation
- `apps/poc-model`
  Deployed model artifacts used by backend inference (`swd_yolo_best.pt`, `model_metrics.json`)
- `src`, `configs`, `data`, `runs`
  Training/evaluation pipeline and experiment artifacts
- `docker-compose.yml`
  Local PostgreSQL + Neo4j

See [REPO_STRUCTURE.md](/Users/louis.ferger-andrews/Desktop/insect_yellow_tape/insect-detection-yellow-traps/REPO_STRUCTURE.md) for a concise tree overview.

## Prerequisites

- Docker Desktop (or Docker Engine + Compose)
- Python `3.11+`
- Node.js `18+` (recommended `20+`)
- npm

## Local URLs

- Frontend: `http://localhost:5173`
- Backend API docs: `http://localhost:8000/docs`
- Backend health: `http://localhost:8000/health`
- Neo4j Browser: `http://localhost:7474`

## 1) Start databases

From repo root:

```bash
docker compose up -d postgres neo4j
```

Default DB credentials are defined in `docker-compose.yml` and expected by backend `.env`.

## 2) Start backend

```bash
cd apps/backend
cp .env.example .env
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
./scripts/start.sh
```

Default seeded admin (change in `.env`):
- Email: `admin@swd-monitoring.com`
- Password: `Admin123ChangeMe`

Important backend model paths (from `.env`):
- `MODEL_WEIGHTS_PATH=../poc-model/swd_yolo_best.pt`
- `MODEL_METRICS_PATH=../poc-model/model_metrics.json`

## 3) Start frontend

```bash
cd apps/frontend
cp .env.example .env
npm install
npm run dev
```

Frontend uses `VITE_API_BASE` (defaults to `http://localhost:8000`).

## Core web workflow

1. Log in
2. Create field (draw polygon on map)
3. Place trap points in field
4. Upload trap images by selecting trap + date range
5. Run inference and view analytics
6. Use Exploratory Analysis for field-scoped report generation (HTML export with charts)

## CV pipeline quickstart (CLI)

From repo root:

```bash
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt

.venv/bin/python -m src.cli list-approaches
.venv/bin/python -m src.cli prepare-data --project insect_yellow --approach yolo --config configs/yolo.yaml
.venv/bin/python -m src.cli train --project insect_yellow --approach yolo --config configs/yolo.yaml
.venv/bin/python -m src.cli evaluate --project insect_yellow --approach yolo --config configs/yolo.yaml
```

### One-command strong retraining

```bash
./scripts/train_strong_yolo.sh
```

This script runs:
1. `prepare-data`
2. `train`
3. `evaluate`
4. copies newest `best.pt` to `apps/poc-model/swd_yolo_best.pt`

Metrics are exported to `apps/poc-model/model_metrics.json` for backend model overview.

## Strong YOLO configuration

`configs/yolo.yaml` is tuned for stronger small-object detection:

- Latest-first model fallback:
  - `yolo26m.pt`
  - `yolo11m.pt`
  - `yolov8m.pt`
- Higher input resolution (`img_size: 1024`)
- Stronger train defaults (AdamW, cosine LR, warmup, augmentation, close_mosaic)
- Single-class setup for insects

## Validation metrics used

The evaluation pipeline writes:
- `precision`
- `recall`
- `f1`
- `mAP50`
- `mAP50_95` (and `mAP50-95` compatibility key)
- `count_error` (absolute count error over val images)

Backend model overview reads these from `apps/poc-model/model_metrics.json`.

## Environment and external data

The backend supports environmental sync per field:
- Open-Meteo
- NASA POWER
- Meteostat

Data is merged and stored in daily tables for analytics and exploratory reporting.

## Security notes

- Do not commit real secrets in `.env` files.
- Use a long random `SECRET_KEY`.
- Rotate compromised API keys immediately.
- This setup is for localhost MVP/research; production needs hardened deployment and secret management.

## Troubleshooting

### Backend `Cannot reach API`
- Confirm backend is running on `:8000`
- Check `http://localhost:8000/health`

### Login fails
- Confirm seeded admin credentials in `apps/backend/.env`
- Ensure PostgreSQL container is up

### Neo4j connection errors
- Confirm `neo4j` container is up
- Check `NEO4J_URI`, `NEO4J_USER`, `NEO4J_PASSWORD` in backend `.env`

### Model stats show missing metrics
- Run evaluation:
  ```bash
  .venv/bin/python -m src.cli evaluate --project insect_yellow --approach yolo --config configs/yolo.yaml
  ```
- Confirm file exists:
  `apps/poc-model/model_metrics.json`

### YOLO dataset path errors
- Re-run:
  ```bash
  .venv/bin/python -m src.cli prepare-data --project insect_yellow --approach yolo --config configs/yolo.yaml
  ```

### Frontend build/type errors
- Reinstall deps:
  ```bash
  cd apps/frontend
  rm -rf node_modules package-lock.json
  npm install
  npm run build
  ```

## Useful commands

From repo root:

```bash
# start infra
docker compose up -d postgres neo4j

# backend health
curl http://localhost:8000/health

# frontend production build check
cd apps/frontend && npm run build

# backend syntax check
cd ../.. && python3 -m compileall apps/backend/app
```

## License

See [LICENSE](/Users/louis.ferger-andrews/Desktop/insect_yellow_tape/insect-detection-yellow-traps/LICENSE).
