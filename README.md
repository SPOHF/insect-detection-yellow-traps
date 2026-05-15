# SWD Insect Monitoring Platform

End-to-end local platform for monitoring *Drosophila suzukii* on yellow sticky traps.

This repo is now kept intentionally simple:
- `03_application/` is the product code you run.
- `04_ml_insect_detection_model/` stores model weight files only.

## Repository Layout

This repository is organized into four top-level folders:

- `01_project_docs_notes/` -> documentation and notes
- `02_pm_analytics_dashboard/` -> internal Streamlit PM dashboard
- `03_application/` -> production app (backend, frontend, runtime model, compose files)
- `04_ml_insect_detection_model/` -> model weight files only

## Quickstart: run the application locally

This is the fastest path to run the full monitoring app on your machine. Run the commands from the repository root unless a step says otherwise.

### 1) Install prerequisites

- Docker Desktop (or Docker Engine + Compose)
- Python `3.11+`
- Node.js `18+` (recommended `20+`)
- npm

### 2) Create the backend environment file

```bash
cd 03_application/backend
cp .env.example .env
```

Edit `03_application/backend/.env` and make sure it contains these values for local development:

```env
APP_NAME=SWD Monitoring API
APP_ENV=development
API_HOST=0.0.0.0
API_PORT=8000
SECRET_KEY=replace-with-a-long-random-secret-value-at-least-32-chars
ACCESS_TOKEN_EXPIRE_MINUTES=120

POSTGRES_URL=postgresql+psycopg2://swd_user:swd_pass@localhost:5432/swd_monitoring
NEO4J_URI=bolt://localhost:7687
NEO4J_USER=neo4j
NEO4J_PASSWORD=neo4j_password

MODEL_WEIGHTS_PATH=../poc-model/swd_yolo_best.pt
MODEL_METRICS_PATH=../poc-model/model_metrics.json
MODEL_CONFIDENCE=0.25
MODEL_IMAGE_SIZE=640
OPENAI_API_KEY=
OPENAI_CHAT_MODEL=gpt-4.1-mini

UPLOAD_DIR=storage/uploads
CORS_ORIGINS=http://localhost:5173

ADMIN_EMAIL=admin@swd-monitoring.com
ADMIN_PASSWORD=Admin123ChangeMe
ADMIN_NAME=Local Admin
```

Notes:

- `SECRET_KEY` is required and must be at least 32 characters.
- `POSTGRES_URL`, `NEO4J_URI`, `NEO4J_USER`, and `NEO4J_PASSWORD` must match `03_application/docker-compose.yml` when you run the local database containers.
- `MODEL_WEIGHTS_PATH` must point to an existing model file. The repo includes `03_application/poc-model/swd_yolo_best.pt`.
- `MODEL_METRICS_PATH` must point to `03_application/poc-model/model_metrics.json`.
- `OPENAI_API_KEY` can stay empty unless you are using OpenAI-backed features.
- For staging or production, change `SECRET_KEY`, change `ADMIN_PASSWORD`, set `APP_ENV` to `staging` or `production`, and use explicit `CORS_ORIGINS`. Do not use the local defaults outside development.

### 3) Create the frontend environment file

```bash
cd 03_application/frontend
cp .env.example .env
```

For local development, `03_application/frontend/.env` should contain:

```env
VITE_API_BASE=http://localhost:8000
```

### 4) Start Postgres and Neo4j

```bash
cd 03_application
docker compose -f docker-compose.yml up -d postgres neo4j
```

This starts:

- Postgres on `localhost:5432`
- Neo4j browser on `http://localhost:7474`
- Neo4j Bolt on `localhost:7687`

### 5) Start the backend API

```bash
cd 03_application/backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
./scripts/start.sh
```

Backend URL: `http://localhost:8000`
Docs: `http://localhost:8000/docs`

On startup, the backend creates the local admin user if it does not exist:

- Email: `admin@swd-monitoring.com`
- Password: `Admin123ChangeMe`

### 6) Start the frontend

```bash
cd 03_application/frontend
npm install
npm run dev
```

Frontend URL: `http://localhost:5173`

Log in with the admin credentials above.

## Run the whole app with Docker

You can also run the backend and frontend in containers.

```bash
cd 03_application
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
docker compose -f docker-compose.yml -f docker-compose.app.yml up --build
```

When using `docker-compose.app.yml`, the backend service overrides these values for container networking:

```env
POSTGRES_URL=postgresql+psycopg2://swd_user:swd_pass@postgres:5432/swd_monitoring
NEO4J_URI=bolt://neo4j:7687
MODEL_WEIGHTS_PATH=/models/swd_yolo_best.pt
MODEL_METRICS_PATH=/models/model_metrics.json
CORS_ORIGINS=http://localhost:5173
```

URLs are the same:

- Frontend: `http://localhost:5173`
- Backend: `http://localhost:8000`
- API docs: `http://localhost:8000/docs`
- Neo4j browser: `http://localhost:7474`

## Stop local services

```bash
cd 03_application
docker compose -f docker-compose.yml down
```

If you started the full Docker app, stop it with:

```bash
cd 03_application
docker compose -f docker-compose.yml -f docker-compose.app.yml down
```

## PM analytics dashboard

Create its environment file:

```bash
cp 02_pm_analytics_dashboard/.env.example 02_pm_analytics_dashboard/.env
```

Set these values in `02_pm_analytics_dashboard/.env`:

```env
GITHUB_TOKEN=your_github_pat_here
GITHUB_OWNER=your_org_or_user
GITHUB_REPO=your_repo_name
DASHBOARD_PASSKEY=change_this_to_a_strong_passkey
SHOW_INTERNAL_ERRORS=false
```

Then run it:

```bash
python3 -m venv .venv
source .venv/bin/activate
pip install -r 02_pm_analytics_dashboard/requirements.txt
streamlit run 02_pm_analytics_dashboard/app.py
```

## Additional docs

- `REPO_STRUCTURE.md`
- `01_project_docs_notes/docs/standards/`
