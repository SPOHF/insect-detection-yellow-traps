from __future__ import annotations

from datetime import date, timedelta
from pathlib import Path
from typing import List
from uuid import uuid4

from fastapi import UploadFile

ALLOWED_IMAGE_EXTENSIONS = {'.jpg', '.jpeg', '.png', '.webp'}
MAX_UPLOAD_SIZE_MB = 20


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


def validate_upload_file(upload: UploadFile) -> None:
    filename = upload.filename or ''
    if not filename:
        raise ValueError('Upload file must have a filename')

    suffix = Path(filename).suffix.lower()
    if suffix not in ALLOWED_IMAGE_EXTENSIONS:
        allowed = ', '.join(sorted(ALLOWED_IMAGE_EXTENSIONS))
        raise ValueError(f'Unsupported image type "{suffix}". Allowed: {allowed}')


def save_upload_file(upload_root: Path, upload: UploadFile) -> Path:
    upload_root.mkdir(parents=True, exist_ok=True)
    filename = f'{uuid4().hex}_{secure_filename(upload.filename or "upload.jpg")}'
    destination = upload_root / filename
    max_bytes = MAX_UPLOAD_SIZE_MB * 1024 * 1024
    size_bytes = 0
    try:
        with destination.open('wb') as out_file:
            while True:
                chunk = upload.file.read(1024 * 1024)
                if not chunk:
                    break
                size_bytes += len(chunk)
                if size_bytes > max_bytes:
                    raise ValueError(f'Upload exceeds max size of {MAX_UPLOAD_SIZE_MB} MB')
                out_file.write(chunk)
        if size_bytes == 0:
            raise ValueError('Uploaded file is empty')
    except Exception:
        destination.unlink(missing_ok=True)
        raise
    return destination
