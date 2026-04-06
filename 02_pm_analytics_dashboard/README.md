# PM Analytics Dashboard

Internal Streamlit dashboard for project management analytics powered by GitHub repository data.

## What this MVP covers

- Pulls repository data from GitHub REST API (read-only):
  - issues
  - pull requests
  - labels
  - milestones
  - assignees
- Handles pagination (`per_page=100` + next-link traversal)
- Provides interactive dashboard sections:
  - Project Management
  - Deployment
- Includes sidebar filters:
  - milestone (including current milestone shortcut)
  - date range
  - assignee
  - label
  - issue state
- Supports CSV export for filtered issues and PRs
- Includes an inferred Project -> Epic -> Feature tree with Feature -> Task drill-down and issue detail panel

## Project structure

```text
02_pm_analytics_dashboard/
├── app.py
├── requirements.txt
├── README.md
├── .env.example
└── src
    ├── github_client.py
    ├── data_loader.py
    ├── metrics.py
    ├── charts.py
    └── utils.py
```

## Prerequisites

- Python 3.10+
- A GitHub Personal Access Token with repository read access

## Setup

1. Create and activate a virtual environment.
2. Install dependencies:

```bash
pip install -r 02_pm_analytics_dashboard/requirements.txt
```

3. Configure environment variables (example values shown):

```bash
export GITHUB_TOKEN="ghp_xxxxxxxxxxxxxxxxx"
export GITHUB_OWNER="your-org-or-username"
export GITHUB_REPO="your-repository"
```

Optional: copy `.env.example` to `.env` in `02_pm_analytics_dashboard/` and set values there.

## Run locally

```bash
streamlit run 02_pm_analytics_dashboard/app.py
```

## Assumptions

- Issue-focused metrics explicitly exclude pull requests by filtering out `issues` endpoint entries that include `pull_request`.
- PR metrics are sourced from the dedicated `/pulls` endpoint to include `merged_at` and accurate merge timing.
- Milestone completion percentage is computed from milestone aggregates (`closed_issues / (open_issues + closed_issues)`).
- Date range filters are applied on `created_at` timestamps.
- Hierarchy mapping (`Epic` -> `Feature` -> `Task`) is inferred from issue labels, title prefixes (`[Epic]`, `[Feature]`, `[Task]`), milestone context, and title/body keyword similarity.
- If labels are not standardized (e.g., missing `bug`, `feature`, `enhancement`), bug vs feature split may be empty.
- Dashboard is read-only and does not mutate repository state.

## Notes on robustness

- Handles missing milestones, labels, assignees, and empty datasets gracefully.
- Uses Streamlit cache (`ttl=900s`) to reduce repeated API calls.
