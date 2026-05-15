# Repository Standards

## Directory and Ownership

- Keep app code inside `03_application/`.
- Keep model weights in `04_ml_insect_detection_model/weights/`.
- Keep docs in `01_project_docs_notes/docs/`.

## Data Handling

- Processed/training artifacts should be reviewed before commit and generally kept out of source control unless explicitly required.
- Large binaries should use artifact storage, not git history.

## Configuration

- Keep local secrets in `.env` files that are gitignored.
- Check in `.env.example` for required env vars.
- Prefer explicit defaults in config code.

## Logging

- Runtime logs and PID files must not be committed.
- Use structured logging for backend services where practical.

## Git Hygiene

- Keep commits focused.
- Rebase/squash noisy fixup commits before merge when possible.
- Never force-push shared branches unless coordinating with the team.
