# Project Layout Guide

This guide makes it obvious which part of the repository serves which purpose.

## Top-level navigation (recommended)

- `01_project_docs_notes/`: documentation and notes entrypoint
- `02_pm_analytics_dashboard/`: canonical PM dashboard
- `03_application/`: production app entrypoint
- `04_ml_insect_detection_model/`: model weight storage

These folders provide fast orientation without breaking existing canonical paths.

## Product application (`03_application/`)

- `03_application/frontend/`:
  - React UI used by users (login, field creation, uploads, analytics pages).
- `03_application/backend/`:
  - FastAPI API, auth, DB models, upload/inference services.
- `03_application/poc-model/`:
  - Runtime model artifact consumed by backend inference.

## Model artifacts (`04_ml_insect_detection_model/`)

- `weights/`: model weight artifacts only.

## Validation and quality (`tests/`, `scripts/`)

- `tests/`: unit/integration tests across backend/CV modules.
- `scripts/`: reusable automation scripts (quality checks, training helpers, sync scripts).

## PM Dashboard

- Canonical location is `02_pm_analytics_dashboard/`.
