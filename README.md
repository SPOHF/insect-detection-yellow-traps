# SWD Insect Monitoring Platform

End-to-end platform for monitoring *Drosophila suzukii* on yellow sticky traps. The product app combines a FastAPI backend, React/Vite frontend, Postgres, Neo4j, and a YOLO model artifact for trap-image inference.

## Repository Layout

- `01_project_docs_notes/` - project notes, standards, and supporting documentation
- `02_pm_analytics_dashboard/` - internal Streamlit project-management and quality dashboard
- `03_application/` - runnable product app
- `03_application/backend/` - FastAPI API, auth, uploads, analytics, inference integration
- `03_application/frontend/` - React/Vite user interface
- `03_application/poc-model/` - model files consumed by the backend at runtime
- `04_ml_insect_detection_model/` - ML experiment/config/test code and model-development assets

`develop` is the active integration branch before promotion to `main`.

## Prerequisites

Install these before starting:

- Docker Desktop, or Docker Engine with Docker Compose
- Python `3.11+`
- Node.js `20+`
- npm
- Git

Optional:

- OpenAI API key, only if you want OpenAI-backed narrative analysis features
- GitHub personal access token, only if you run the PM analytics dashboard

## Fastest Local Setup

Run these commands from the repository root unless a step says otherwise.

### 1) Configure Backend

```bash
cd 03_application/backend
cp .env.example .env
```

Edit `03_application/backend/.env` and keep these local-development values aligned with `03_application/docker-compose.yml`:

```env
APP_NAME=SWD Monitoring API
APP_ENV=development
API_HOST=127.0.0.1
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
MODEL_DEVICE=auto
MODEL_MPS_HIGH_WATERMARK_RATIO=0.7

OPENAI_API_KEY=
OPENAI_CHAT_MODEL=gpt-4.1-mini

UPLOAD_DIR=storage/uploads
UPLOAD_STORAGE_BACKEND=local
CORS_ORIGINS=http://localhost:5173

ADMIN_EMAIL=admin@swd-monitoring.com
ADMIN_PASSWORD=Admin123ChangeMe
ADMIN_NAME=Local Admin
```

Important:

- `SECRET_KEY` must be at least 32 characters.
- `ADMIN_PASSWORD=Admin123ChangeMe` is accepted only for local development.
- `MODEL_WEIGHTS_PATH` must point to an existing model file. The expected local file is `03_application/poc-model/swd_yolo_best.pt`.
- `MODEL_METRICS_PATH` should point to `03_application/poc-model/model_metrics.json`.
- Keep `API_HOST=127.0.0.1` for local development unless you intentionally need LAN access.

### 2) Configure Frontend

```bash
cd ../frontend
cp .env.example .env
```

`03_application/frontend/.env` should contain:

```env
VITE_API_BASE=http://localhost:8000
```

### 3) Start Databases

```bash
cd ..
docker compose -f docker-compose.yml up -d postgres neo4j
```

This starts:

- Postgres: `localhost:5432`
- Neo4j browser: `http://localhost:7474`
- Neo4j Bolt: `localhost:7687`

### 4) Start Backend API

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
./scripts/start.sh
```

Backend URLs:

- API: `http://localhost:8000`
- API docs: `http://localhost:8000/docs`

On startup, the backend creates the local admin user if missing:

- Email: `admin@swd-monitoring.com`
- Password: `Admin123ChangeMe`

### 5) Start Frontend

Open a second terminal:

```bash
cd 03_application/frontend
npm install
npm run dev
```

Frontend URL:

- `http://localhost:5173`

Log in with the local admin credentials from the backend section.

## Full Docker Setup

Use this if you want backend and frontend in containers as well as Postgres and Neo4j.

```bash
cd 03_application
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
docker compose -f docker-compose.yml -f docker-compose.app.yml up --build
```

The app compose file intentionally overrides container-only values:

```env
POSTGRES_URL=postgresql+psycopg2://swd_user:swd_pass@postgres:5432/swd_monitoring
NEO4J_URI=bolt://neo4j:7687
MODEL_WEIGHTS_PATH=/models/swd_yolo_best.pt
MODEL_METRICS_PATH=/models/model_metrics.json
CORS_ORIGINS=http://localhost:5173
```

Docker URLs:

- Frontend: `http://localhost:5173`
- Backend: `http://localhost:8000`
- API docs: `http://localhost:8000/docs`
- Neo4j browser: `http://localhost:7474`

## Stop Local Services

Database-only setup:

```bash
cd 03_application
docker compose -f docker-compose.yml down
```

Full Docker app:

```bash
cd 03_application
docker compose -f docker-compose.yml -f docker-compose.app.yml down
```

To remove database volumes as well:

```bash
cd 03_application
docker compose -f docker-compose.yml -f docker-compose.app.yml down -v
```

## Production / Staging Checklist

Before deploying outside local development:

- Set `APP_ENV=staging` or `APP_ENV=production`.
- Use a new random `SECRET_KEY` of at least 32 characters.
- Change `ADMIN_PASSWORD`; the local default is rejected outside development.
- Set explicit frontend origins in `CORS_ORIGINS`; do not use `*`.
- Keep Postgres and Neo4j private; do not expose database ports publicly.
- Serve the frontend and backend over HTTPS.
- Keep `.env` files and tokens out of Git.
- Set `OPENAI_API_KEY` only in secret storage if OpenAI-backed features are enabled.
- Use `UPLOAD_STORAGE_BACKEND=azure` only with a valid `AZURE_STORAGE_CONNECTION_STRING` and `AZURE_STORAGE_CONTAINER`.

## Validation Commands

Run these before a release or after dependency changes.

Backend tests:

```bash
cd 03_application/backend
source .venv/bin/activate
python -m pytest -q ../tests/backend
```

ML tests:

```bash
PYTHONPATH=04_ml_insect_detection_model/src 03_application/backend/.venv/bin/python -m pytest -q 04_ml_insect_detection_model/tests
```

Frontend tests and build:

```bash
cd 03_application/frontend
npm test
npm run build
```

Frontend coverage:

```bash
cd 03_application/frontend
npm test -- --coverage
```

Security checks:

```bash
cd 03_application/frontend
npm audit --audit-level=low

cd ../..
03_application/backend/.venv/bin/python -m pip_audit -r 03_application/backend/requirements.txt
03_application/backend/.venv/bin/python -m pip_audit -r requirements.txt
03_application/backend/.venv/bin/python -m pip_audit -r 02_pm_analytics_dashboard/requirements.txt
03_application/backend/.venv/bin/python -m bandit -q -r 03_application/backend/app -f txt
03_application/backend/.venv/bin/python -m bandit -q -r scripts 02_pm_analytics_dashboard 04_ml_insect_detection_model/src -f txt
```

## PM Analytics Dashboard

The PM dashboard is separate from the product app. It reads GitHub metadata and displays project, quality, deployment, and architecture views.

Create its environment file:

```bash
cp 02_pm_analytics_dashboard/.env.example 02_pm_analytics_dashboard/.env
```

Set these values in `02_pm_analytics_dashboard/.env`:

```env
GITHUB_TOKEN=your_read_only_github_pat_here
GITHUB_OWNER=SPOHF
GITHUB_REPO=insect-detection-yellow-traps
DASHBOARD_PASSKEY=change_this_to_a_strong_passkey
SHOW_INTERNAL_ERRORS=false
```

Run it:

```bash
python3 -m venv .venv
source .venv/bin/activate
pip install -r 02_pm_analytics_dashboard/requirements.txt
streamlit run 02_pm_analytics_dashboard/app.py
```

Streamlit URL:

- `http://localhost:8501`

Security notes:

- Use a fine-grained, read-only GitHub token.
- Do not commit `02_pm_analytics_dashboard/.env`.
- Keep `SHOW_INTERNAL_ERRORS=false` outside local debugging.

## ML Component

The active application consumes model artifacts from `03_application/poc-model/`. The ML source and tests live in `04_ml_insect_detection_model/`.

Run ML tests:

```bash
PYTHONPATH=04_ml_insect_detection_model/src 03_application/backend/.venv/bin/python -m pytest -q 04_ml_insect_detection_model/tests
```

Relevant ML folders:

- `04_ml_insect_detection_model/configs/` - training, evaluation, and inference configs
- `04_ml_insect_detection_model/src/yolo2026_seg/` - ML pipeline code
- `04_ml_insect_detection_model/tests/` - ML unit tests
- `04_ml_insect_detection_model/weights/` - model checkpoints

## Troubleshooting

- `zsh: permission denied: path/to/test.py`: run tests with `pytest`, not by executing the file directly.
- Backend cannot connect to Postgres: confirm `docker compose -f 03_application/docker-compose.yml ps` shows Postgres running and `POSTGRES_URL` uses `localhost` for local non-container backend.
- Backend cannot connect to Neo4j: confirm Neo4j is running and `NEO4J_URI=bolt://localhost:7687` for local non-container backend.
- Frontend API calls fail: confirm backend is running on `http://localhost:8000` and frontend `.env` has `VITE_API_BASE=http://localhost:8000`.
- Upload or inference fails: confirm `MODEL_WEIGHTS_PATH` exists and `UPLOAD_DIR` is writable.
- Docker app backend cannot reach databases: use both compose files together, because `docker-compose.app.yml` depends on services from `docker-compose.yml`.

## Additional Documentation

- `03_application/README.md`
- `03_application/backend/README.md`
- `03_application/frontend/README.md`
- `02_pm_analytics_dashboard/README.md`
- `04_ml_insect_detection_model/README.md`
- `REPO_STRUCTURE.md`
- `SECURITY.md`
