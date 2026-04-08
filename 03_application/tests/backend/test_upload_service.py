from __future__ import annotations

from datetime import date
from io import BytesIO
from pathlib import Path
from types import SimpleNamespace

import pytest

pytest.importorskip("fastapi")

from app.services.upload_service import allocate_capture_dates, save_upload_file, secure_filename


def test_secure_filename_strips_unsafe_chars() -> None:
    assert secure_filename("..//bad*name?.jpg") == "badname.jpg"
    assert secure_filename("") == "image.jpg"


def test_allocate_capture_dates_spreads_evenly() -> None:
    start = date(2026, 1, 1)
    end = date(2026, 1, 11)
    values = allocate_capture_dates(start, end, 3)
    assert values == [date(2026, 1, 1), date(2026, 1, 6), date(2026, 1, 11)]


def test_save_upload_file_persists_content(tmp_path: Path) -> None:
    content = b"abc123"
    upload = SimpleNamespace(filename="trap.jpg", file=BytesIO(content))
    saved = save_upload_file(tmp_path, upload)
    assert saved.exists()
    assert saved.read_bytes() == content
    assert saved.name.endswith("_trap.jpg")
