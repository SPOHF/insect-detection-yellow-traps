# Repository Structure

## 1) `01_project_docs_notes/`
- Project docs and notes
- Standards and governance docs in `01_project_docs_notes/docs/standards/`

## 2) `02_pm_analytics_dashboard/`
- Internal Streamlit SDLC analytics dashboard
- Uses GitHub repo metadata (issues/PRs/milestones)

## 3) `03_application/`
- `backend/`: FastAPI API, auth, ingestion, inference services
- `frontend/`: React app for user workflow
- `poc-model/`: runtime model artifacts used by backend
- `docker-compose.yml`: infrastructure (Postgres, Neo4j)
- `docker-compose.app.yml`: app service composition

## 4) `04_ml_insect_detection_model/`
- `weights/`: model weight files only

## Root-level system folders
- `.git/`, `.github/`, `.venv/`, `.pytest_cache/` (tooling/system folders)
