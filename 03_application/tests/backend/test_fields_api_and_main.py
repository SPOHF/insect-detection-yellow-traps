"""
File Purpose: test_fields_api_and_main.py module
Inputs: Imported modules, function arguments, request payloads where applicable.
Outputs: Return values, API responses, and side effects documented in functions/classes.
Process: Implements module-specific business or UI logic.
Authorship: Louis Ferger-Andrews (@LouisFerger-Andrews)
"""

from __future__ import annotations

from dataclasses import dataclass

import pytest

from app.api import fields as fields_api
from app import main as main_module
from app.main import health


@dataclass
class DummyUser:
    id: int
    role: str = "user"


def test_create_and_list_fields(monkeypatch: pytest.MonkeyPatch) -> None:
    class FakeGraph:
        def create_field(self, owner_user_id, field_id, name, location):  # noqa: ANN001
            return {
                "id": field_id,
                "owner_user_id": owner_user_id,
                "name": name,
                "location": location,
                "trap_count": 0,
            }

        def list_fields_for_user(self, user_id, is_admin=False):  # noqa: ANN001
            return [
                {
                    "id": "field-1",
                    "owner_user_id": user_id,
                    "name": "Field",
                    "location": "Loc",
                    "trap_count": 2,
                }
            ]

        def close(self):
            return None

    monkeypatch.setattr(fields_api, "GraphService", lambda: FakeGraph())

    payload = fields_api.FieldCreateRequest(name="Field", location="Loc")
    created = fields_api.create_field(payload, current_user=DummyUser(id=7))
    assert created.id.startswith("field-")
    assert created.owner_user_id == 7

    listed = fields_api.list_fields(current_user=DummyUser(id=7, role="admin"))
    assert len(listed) == 1
    assert listed[0].id == "field-1"


def test_health_endpoint() -> None:
    assert health() == {"status": "ok"}


def test_run_schema_upgrades_executes_expected_statements(monkeypatch: pytest.MonkeyPatch) -> None:
    statements: list[str] = []
    commits = 0

    class FakeSession:
        def __init__(self, engine):  # noqa: ANN001
            assert engine is main_module.engine

        def __enter__(self):
            return self

        def __exit__(self, exc_type, exc, tb):  # noqa: ANN001
            return None

        def execute(self, statement):  # noqa: ANN001
            statements.append(str(statement))

        def commit(self):
            nonlocal commits
            commits += 1

    monkeypatch.setattr(main_module, "Session", FakeSession)

    main_module._run_schema_upgrades()

    assert "trap_uploads ADD COLUMN IF NOT EXISTS trap_id" in statements[0]
    assert "trap_points ADD COLUMN IF NOT EXISTS custom_name" in statements[1]
    assert commits == 1


def test_startup_event_creates_admin_and_seeds_graph(monkeypatch: pytest.MonkeyPatch) -> None:
    calls: list[tuple[str, object]] = []
    users: list[object] = []

    class FakeMetadata:
        def create_all(self, *, bind):  # noqa: ANN001
            calls.append(("create_all", bind))

    class FakeBase:
        metadata = FakeMetadata()

    class FakeQuery:
        def filter(self, *args, **kwargs):  # noqa: ANN002, ANN003
            return self

        def first(self):
            return None

    class FakeSession:
        def __init__(self, engine):  # noqa: ANN001
            assert engine is main_module.engine

        def __enter__(self):
            return self

        def __exit__(self, exc_type, exc, tb):  # noqa: ANN001
            return None

        def query(self, model):  # noqa: ANN001
            assert model is main_module.User
            return FakeQuery()

        def add(self, user):  # noqa: ANN001
            users.append(user)

        def commit(self):
            calls.append(("commit", "admin"))

        def refresh(self, user):  # noqa: ANN001
            user.id = 42
            calls.append(("refresh", user.email))

        def execute(self, statement):  # noqa: ANN001
            calls.append(("execute", str(statement)))

    class FakeGraphService:
        def initialize(self):
            calls.append(("graph", "initialize"))

        def ensure_user_node(self, user_id, email, full_name):  # noqa: ANN001
            calls.append(("graph_user", (user_id, email, full_name)))

        def seed_example_field(self, user_id):  # noqa: ANN001
            calls.append(("graph_seed", user_id))

        def close(self):
            calls.append(("graph", "close"))

    monkeypatch.setattr(main_module, "Base", FakeBase)
    monkeypatch.setattr(main_module, "Session", FakeSession)
    monkeypatch.setattr(main_module, "GraphService", FakeGraphService)
    monkeypatch.setattr(main_module, "hash_password", lambda value: f"hashed:{value}")
    monkeypatch.setattr(
        main_module,
        "settings",
        type(
            "Settings",
            (),
            {
                "admin_email": "ADMIN@EXAMPLE.TEST",
                "admin_name": "Admin User",
                "admin_password": "AdminPassword123!",
            },
        )(),
    )

    main_module.startup_event()

    assert users[0].email == "admin@example.test"
    assert users[0].password_hash == "hashed:AdminPassword123!"
    assert ("graph_user", (42, "admin@example.test", "Admin User")) in calls
    assert calls[-1] == ("graph", "close")
