# Repository Standards

## Directory and Ownership

- Keep app code inside `apps/`.
- Keep reusable training pipeline logic in `src/`.
- Keep docs in `docs/`.
- Keep scripts in `scripts/` and make them idempotent when possible.

## Data Handling

- Raw data belongs in `data/raw/` and is not committed.
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

