from typing import Any, Dict, List, Optional

import pandas as pd

from src.github_client import GitHubClient
from src.utils import ensure_datetime


def _extract_label_names(labels: List[Dict[str, Any]]) -> List[str]:
    return [label.get("name", "") for label in labels if label.get("name")]


def _extract_assignees(assignees: List[Dict[str, Any]]) -> List[str]:
    return [assignee.get("login", "") for assignee in assignees if assignee.get("login")]


def _normalize_issue(item: Dict[str, Any], project_fields: Optional[Dict[str, str]] = None) -> Dict[str, Any]:
    milestone = item.get("milestone") or {}
    fields = project_fields or {}
    return {
        "id": item.get("id"),
        "number": item.get("number"),
        "title": item.get("title"),
        "body": item.get("body"),
        "state": item.get("state"),
        "state_reason": item.get("state_reason"),
        "created_at": item.get("created_at"),
        "updated_at": item.get("updated_at"),
        "closed_at": item.get("closed_at"),
        "author": (item.get("user") or {}).get("login"),
        "labels": _extract_label_names(item.get("labels", [])),
        "assignees": _extract_assignees(item.get("assignees", [])),
        "milestone": milestone.get("title"),
        "sprint": fields.get("sprint"),
        "project_status": fields.get("project_status"),
        "project_size": fields.get("size"),
        "url": item.get("html_url"),
    }


def _normalize_pr(item: Dict[str, Any]) -> Dict[str, Any]:
    milestone = item.get("milestone") or {}
    return {
        "id": item.get("id"),
        "number": item.get("number"),
        "title": item.get("title"),
        "state": item.get("state"),
        "created_at": item.get("created_at"),
        "updated_at": item.get("updated_at"),
        "closed_at": item.get("closed_at"),
        "merged_at": item.get("merged_at"),
        "author": (item.get("user") or {}).get("login"),
        "labels": _extract_label_names(item.get("labels", [])),
        "assignees": _extract_assignees(item.get("assignees", [])),
        "milestone": milestone.get("title"),
        "url": item.get("html_url"),
    }


def _to_dataframe(records: List[Dict[str, Any]], datetime_columns: List[str]) -> pd.DataFrame:
    df = pd.DataFrame(records)
    if df.empty:
        return df

    for column in datetime_columns:
        df[column] = ensure_datetime(df, column)

    return df


def load_repository_data(owner: str, repo: str, token: str) -> Dict[str, pd.DataFrame]:
    client = GitHubClient(owner=owner, repo=repo, token=token)

    raw_issues = client.get_issues()
    raw_pulls = client.get_pulls()
    raw_labels = client.get_labels()
    raw_milestones = client.get_milestones()
    raw_assignees = client.get_assignees()

    issue_project_fields: Dict[int, Dict[str, str]] = {}
    try:
        issue_project_fields = client.get_issue_project_fields()
    except Exception:
        issue_project_fields = {}

    issue_records = [
        _normalize_issue(item, project_fields=issue_project_fields.get(int(item.get("number", -1)), {}))
        for item in raw_issues
        if "pull_request" not in item
    ]
    pr_records = [_normalize_pr(item) for item in raw_pulls]

    issues_df = _to_dataframe(issue_records, ["created_at", "updated_at", "closed_at"])
    prs_df = _to_dataframe(pr_records, ["created_at", "updated_at", "closed_at", "merged_at"])

    labels_df = pd.DataFrame(
        [{"name": label.get("name"), "color": label.get("color")} for label in raw_labels]
    )
    milestones_df = pd.DataFrame(
        [
            {
                "title": milestone.get("title"),
                "state": milestone.get("state"),
                "open_issues": milestone.get("open_issues", 0),
                "closed_issues": milestone.get("closed_issues", 0),
                "due_on": milestone.get("due_on"),
            }
            for milestone in raw_milestones
        ]
    )
    assignees_df = pd.DataFrame([{"login": assignee.get("login")} for assignee in raw_assignees])

    if not milestones_df.empty:
        milestones_df["due_on"] = ensure_datetime(milestones_df, "due_on")

    return {
        "issues": issues_df,
        "pulls": prs_df,
        "labels": labels_df,
        "milestones": milestones_df,
        "assignees": assignees_df,
    }
