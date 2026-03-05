from __future__ import annotations

from datetime import date, timedelta
from pathlib import Path
from typing import List
from uuid import uuid4

from fastapi import UploadFile


def secure_filename(name: str) -> str:
    safe = ''.join(ch for ch in name if ch.isalnum() or ch in ('.', '-', '_'))
    return safe or 'image.jpg'


def allocate_capture_dates(start_date: date, end_date: date, count: int) -> List[date]:
    if count <= 0:
        return []
    if count == 1:
        return [start_date]
    total_days = (end_date - start_date).days
    step = total_days / float(count - 1)
    values: List[date] = []
    for index in range(count):
        offset = round(index * step)
        values.append(start_date + timedelta(days=offset))
    return values


def save_upload_file(upload_root: Path, upload: UploadFile) -> Path:
    upload_root.mkdir(parents=True, exist_ok=True)
    filename = f'{uuid4().hex}_{secure_filename(upload.filename or "upload.jpg")}'
    destination = upload_root / filename
    with destination.open('wb') as out_file:
        while True:
            chunk = upload.file.read(1024 * 1024)
            if not chunk:
                break
            out_file.write(chunk)
    return destination
