"""
File Purpose: upload service module
Inputs: Imported modules, function arguments, request payloads where applicable.
Outputs: Return values, API responses, and side effects documented in functions/classes.
Process: Implements module-specific business or UI logic.
Authorship: Louis Ferger-Andrews (@LouisFerger-Andrews)
"""

from __future__ import annotations

from datetime import date, timedelta
from pathlib import Path
import re
import tempfile
from typing import List, Sequence
from uuid import uuid4

from azure.core.exceptions import ResourceExistsError
from azure.storage.blob import BlobServiceClient
from fastapi import UploadFile

from app.core.config import get_settings

ALLOWED_IMAGE_EXTENSIONS = {'.jpg', '.jpeg', '.png', '.webp'}
MAX_UPLOAD_SIZE_MB = 20
MAX_BATCH_UPLOAD_IMAGES = 50
MAX_SIGNATURE_BYTES = 16
_DATASET_FILENAME_MARKER = re.compile(r"(^|[^a-z])(train|training|valid|validation|test)([^a-z]|$)", re.IGNORECASE)
IDENTIFIER_PATTERN = re.compile(r'^[A-Za-z0-9_-]+$')
TRAP_CODE_PATTERN = re.compile(r'^[A-Za-z0-9 _-]+$')
STORAGE_SEGMENT_PATTERN = re.compile(r'[^A-Za-z0-9_-]+')


def secure_filename(name: str) -> str:
    safe = ''.join(ch for ch in name if ch.isalnum() or ch in ('.', '-', '_'))
    safe = safe.lstrip('.')
    return safe or 'image.jpg'


def secure_storage_segment(value: str | None, fallback: str = 'unassigned') -> str:
    normalized = (value or '').strip()
    normalized = re.sub(r'\s+', '-', normalized)
    safe = STORAGE_SEGMENT_PATTERN.sub('', normalized).strip('-_')
    return safe or fallback


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


def resolve_batch_capture_dates(
    start_date: date,
    end_date: date,
    count: int,
    explicit_capture_dates: Sequence[date] | None = None,
) -> List[date]:
    if explicit_capture_dates is None:
        return allocate_capture_dates(start_date, end_date, count)

    capture_dates = list(explicit_capture_dates)
    if len(capture_dates) != count:
        raise ValueError('capture_dates must contain exactly one date for each uploaded image')
    if any(capture_date < start_date or capture_date > end_date for capture_date in capture_dates):
        raise ValueError('capture_dates must fall within the submitted start_date and end_date range')
    return capture_dates


def validate_upload_file(upload: UploadFile) -> None:
    filename = upload.filename or ''
    if not filename:
        raise ValueError('Upload file must have a filename')

    if _DATASET_FILENAME_MARKER.search(filename):
        raise ValueError('Training/validation/test dataset images are not allowed for production upload endpoints')

    suffix = Path(filename).suffix.lower()
    if suffix not in ALLOWED_IMAGE_EXTENSIONS:
        allowed = ', '.join(sorted(ALLOWED_IMAGE_EXTENSIONS))
        raise ValueError(f'Unsupported image type "{suffix}". Allowed: {allowed}')

    if not _signature_matches_extension(upload, suffix):
        raise ValueError('Upload content does not match the declared image type')


def _signature_matches_extension(upload: UploadFile, suffix: str) -> bool:
    file_obj = upload.file
    try:
        position = file_obj.tell()
    except (AttributeError, OSError):
        position = None
    header = file_obj.read(MAX_SIGNATURE_BYTES)
    if position is not None:
        file_obj.seek(position)

    if suffix in {'.jpg', '.jpeg'}:
        return header.startswith(b'\xff\xd8\xff')
    if suffix == '.png':
        return header.startswith(b'\x89PNG\r\n\x1a\n')
    if suffix == '.webp':
        return len(header) >= 12 and header.startswith(b'RIFF') and header[8:12] == b'WEBP'
    return False


def normalize_optional_text(value: str | None) -> str | None:
    if value is None:
        return None
    normalized = value.strip()
    return normalized or None


def validate_identifier(value: str, field_name: str) -> None:
    if len(value) > 64:
        raise ValueError(f'{field_name} must be 64 characters or fewer')
    if not IDENTIFIER_PATTERN.fullmatch(value):
        raise ValueError(f'{field_name} must contain only letters, numbers, underscores, or hyphens')


def validate_trap_code(value: str) -> None:
    if len(value) > 64:
        raise ValueError('trap_code must be 64 characters or fewer')
    if not TRAP_CODE_PATTERN.fullmatch(value):
        raise ValueError('trap_code must contain only letters, numbers, spaces, underscores, or hyphens')


def build_upload_storage_path(upload_root: Path, field_id: str, trap_code: str, capture_date: date) -> Path:
    return (
        upload_root
        / secure_storage_segment(field_id, 'field-unknown')
        / f'{capture_date:%Y}'
        / f'{capture_date:%m}'
        / f'{capture_date:%d}'
        / secure_storage_segment(trap_code, 'trap-unknown')
    )


def build_upload_blob_name(field_id: str, trap_code: str, capture_date: date, filename: str) -> str:
    path = Path(
        secure_storage_segment(field_id, 'field-unknown'),
        f'{capture_date:%Y}',
        f'{capture_date:%m}',
        f'{capture_date:%d}',
        secure_storage_segment(trap_code, 'trap-unknown'),
        secure_filename(filename),
    )
    return path.as_posix()


def _get_blob_service_client(connection_string: str) -> BlobServiceClient:
    return BlobServiceClient.from_connection_string(connection_string)


def _ensure_azure_container_exists(service_client: BlobServiceClient, container: str) -> None:
    try:
        service_client.create_container(container)
    except ResourceExistsError:
        pass


def _upload_file_to_azure_blob(temp_path: Path, connection_string: str, container: str, blob_name: str) -> str:
    service_client = _get_blob_service_client(connection_string)
    _ensure_azure_container_exists(service_client, container)
    blob_client = service_client.get_blob_client(container=container, blob=blob_name)
    with temp_path.open('rb') as data:
        blob_client.upload_blob(data, overwrite=True)
    return f'azure://{container}/{blob_name}'


def _write_upload_file_to_local_temp(upload: UploadFile) -> Path:
    suffix = Path(upload.filename or 'upload.jpg').suffix
    temp_path = Path(tempfile.NamedTemporaryFile(delete=False, suffix=suffix).name)
    try:
        upload.file.seek(0)
    except (AttributeError, OSError):
        pass
    with temp_path.open('wb') as out_file:
        while True:
            chunk = upload.file.read(1024 * 1024)
            if not chunk:
                break
            out_file.write(chunk)
    return temp_path


def is_azure_storage_reference(image_path: str) -> bool:
    return image_path.startswith('azure://')


def parse_azure_storage_reference(image_path: str) -> tuple[str, str]:
    if not is_azure_storage_reference(image_path):
        raise ValueError('Invalid azure storage reference')
    parts = image_path[len('azure://'):].split('/', 1)
    if len(parts) != 2 or not parts[0] or not parts[1]:
        raise ValueError('Invalid azure storage reference')
    return parts[0], parts[1]


def download_blob_to_temp_file(connection_string: str, container: str, blob_name: str) -> Path:
    service_client = _get_blob_service_client(connection_string)
    blob_client = service_client.get_blob_client(container=container, blob=blob_name)
    temp_path = Path(tempfile.NamedTemporaryFile(delete=False, suffix=Path(blob_name).suffix).name)
    downloader = blob_client.download_blob()
    with temp_path.open('wb') as out_file:
        out_file.write(downloader.readall())
    return temp_path


def save_upload_file(
    upload_root: Path,
    upload: UploadFile,
    *,
    field_id: str | None = None,
    trap_code: str | None = None,
    capture_date: date | None = None,
) -> tuple[Path, str, Path | None]:
    settings = get_settings()
    use_azure = settings.upload_storage_backend == 'azure'

    if use_azure:
        if not settings.azure_storage_connection_string:
            raise ValueError('Azure storage backend is enabled but AZURE_STORAGE_CONNECTION_STRING is not configured')
        if not settings.azure_storage_container:
            raise ValueError('Azure storage backend is enabled but AZURE_STORAGE_CONTAINER is not configured')
        if not (field_id and trap_code and capture_date):
            raise ValueError('Azure storage backend requires field_id, trap_code, and capture_date')

        temp_path = _write_upload_file_to_local_temp(upload)
        blob_name = build_upload_blob_name(field_id, trap_code, capture_date, upload.filename or temp_path.name)
        storage_ref = _upload_file_to_azure_blob(
            temp_path,
            settings.azure_storage_connection_string,
            settings.azure_storage_container,
            blob_name,
        )
        return temp_path, storage_ref, temp_path

    root = upload_root.resolve()
    destination_dir = (
        build_upload_storage_path(root, field_id, trap_code, capture_date)
        if field_id and trap_code and capture_date
        else root
    )
    destination_dir.mkdir(parents=True, exist_ok=True)
    filename = f'{uuid4().hex}_{secure_filename(upload.filename or "upload.jpg")}'
    destination = (destination_dir / filename).resolve()
    if root != destination and root not in destination.parents:
        raise ValueError('Resolved upload path escapes configured upload directory')
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
    return destination, str(destination), None
