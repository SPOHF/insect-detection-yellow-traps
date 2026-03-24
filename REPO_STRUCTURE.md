# Repository Structure

This repo now has two clear parts:

## 1) Existing CV project (original)
- `src/`, `configs/`, `data/`, `runs/`, `weights/`, `tests/`
- Used for model experimentation/training.

## 2) Web MVP (`apps/`)
- `apps/poc-model/`
  - Isolated PoC checkpoint used by backend inference.
- `apps/backend/`
  - `app/api/`: REST endpoints (`auth`, `fields`, `analysis`, `admin`)
  - `app/api/map.py`: map search + field polygon + trap point endpoints
  - `app/models/`: PostgreSQL models
  - `app/services/`: YOLO inference + Neo4j graph logic
  - `storage/uploads/`: uploaded trap images
  - `.env.example`: backend configuration template
- `apps/frontend/`
  - `src/pages/`: Login, Dashboard, Admin screens
  - `src/components/FieldMapManager.tsx`: OpenStreetMap field/trap UI
  - `src/api/`: API client
  - `src/context/`: auth state and token handling

## Infra
- `docker-compose.yml`
  - `postgres` for auth/data
  - `neo4j` for graph field relationships

## Local URLs
- Frontend: `http://localhost:5173`
- Backend API docs: `http://localhost:8000/docs`
- Backend health: `http://localhost:8000/health`
- Neo4j Browser: `http://localhost:7474`
