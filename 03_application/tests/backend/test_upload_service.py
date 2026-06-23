"""
File Purpose: test_upload_service.py module
Inputs: Imported modules, function arguments, request payloads where applicable.
Outputs: Return values, API responses, and side effects documented in functions/classes.
Process: Implements module-specific business or UI logic.
Authorship: Louis Ferger-Andrews (@LouisFerger-Andrews)
"""

from __future__ import annotations

from datetime import date
from io import BytesIO
from pathlib import Path
from types import SimpleNamespace

import pytest
from azure.core.exceptions import ResourceExistsError

pytest.importorskip("fastapi")

from app.services import upload_service as upload_service_module
from app.services.upload_service import (
    allocate_capture_dates,
    build_upload_blob_name,
    build_upload_storage_path,
    download_blob_to_temp_file,
    is_azure_storage_reference,
    normalize_optional_text,
    parse_azure_storage_reference,
    resolve_batch_capture_dates,
    save_upload_file,
    secure_filename,
    secure_storage_segment,
    validate_identifier,
    validate_trap_code,
    validate_upload_file,
)

JPEG_BYTES = b"\xff\xd8\xff\xe0" + b"jpeg-bytes"
PNG_BYTES = b"\x89PNG\r\n\x1a\n" + b"png-bytes"
WEBP_BYTES = b"RIFF\x10\x00\x00\x00WEBP" + b"webp-bytes"


def test_secure_filename_strips_unsafe_chars() -> None:
    assert secure_filename("..//bad*name?.jpg") == "badname.jpg"
    assert secure_filename("") == "image.jpg"
    assert secure_storage_segment(" North Edge! ", "fallback") == "North-Edge"
    assert secure_storage_segment("***", "fallback") == "fallback"


def test_allocate_capture_dates_spreads_evenly() -> None:
    start = date(2026, 1, 1)
    end = date(2026, 1, 11)
    values = allocate_capture_dates(start, end, 3)
    assert values == [date(2026, 1, 1), date(2026, 1, 6), date(2026, 1, 11)]
    assert allocate_capture_dates(start, end, 0) == []
    assert allocate_capture_dates(start, end, 1) == [start]


def test_resolve_batch_capture_dates_validates_explicit_values() -> None:
    start = date(2026, 1, 1)
    end = date(2026, 1, 3)

    assert resolve_batch_capture_dates(start, end, 2, [start, end]) == [start, end]

    with pytest.raises(ValueError, match="exactly one date"):
        resolve_batch_capture_dates(start, end, 2, [start])

    with pytest.raises(ValueError, match="fall within"):
        resolve_batch_capture_dates(start, end, 1, [date(2025, 12, 31)])


def test_save_upload_file_persists_content(tmp_path: Path) -> None:
    content = b"abc123"
    upload = SimpleNamespace(filename="trap.jpg", file=BytesIO(content))
    saved, storage_ref, cleanup_path = save_upload_file(tmp_path, upload)
    assert saved.exists()
    assert saved.read_bytes() == content
    assert saved.name.endswith("_trap.jpg")
    assert storage_ref == str(saved)
    assert cleanup_path is None


def test_save_upload_file_uses_hierarchical_storage_context(tmp_path: Path) -> None:
    content = b"abc123"
    upload = SimpleNamespace(filename="../Trap Image 01.JPG", file=BytesIO(content))
    saved, storage_ref, cleanup_path = save_upload_file(
        tmp_path,
        upload,
        field_id="field-1",
        trap_code="North Edge",
        capture_date=date(2026, 5, 4),
    )

    assert saved.exists()
    assert saved.read_bytes() == content
    assert saved.parent == tmp_path / "field-1" / "2026" / "05" / "04" / "North-Edge"
    assert saved.name.endswith("_TrapImage01.JPG")
    assert storage_ref == str(saved)
    assert cleanup_path is None
    assert build_upload_storage_path(tmp_path, "field-1", "North Edge", date(2026, 5, 4)).samefile(saved.parent)


def test_upload_file_validation_rejects_unsupported_and_dataset_names() -> None:
    with pytest.raises(ValueError, match="must have a filename"):
        validate_upload_file(SimpleNamespace(filename="", file=BytesIO(JPEG_BYTES)))

    with pytest.raises(ValueError, match="Unsupported image type"):
        validate_upload_file(SimpleNamespace(filename="trap.gif", file=BytesIO(b"GIF89a")))

    with pytest.raises(ValueError, match="Training/validation/test dataset images"):
        validate_upload_file(SimpleNamespace(filename="training-sample.jpg", file=BytesIO(JPEG_BYTES)))


def test_upload_file_validation_checks_image_signature() -> None:
    validate_upload_file(SimpleNamespace(filename="trap.jpg", file=BytesIO(JPEG_BYTES)))
    validate_upload_file(SimpleNamespace(filename="trap.png", file=BytesIO(PNG_BYTES)))
    validate_upload_file(SimpleNamespace(filename="trap.webp", file=BytesIO(WEBP_BYTES)))

    spoofed = BytesIO(b"not-an-image")
    with pytest.raises(ValueError, match="content does not match"):
        validate_upload_file(SimpleNamespace(filename="trap.jpg", file=spoofed))
    assert spoofed.tell() == 0


def test_upload_metadata_normalization_and_format_validation() -> None:
    assert normalize_optional_text(None) is None
    assert normalize_optional_text("  field-1  ") == "field-1"
    assert normalize_optional_text("   ") is None

    validate_identifier("field_1-A", "field_id")
    validate_trap_code("Trap 1-A")

    with pytest.raises(ValueError, match="64 characters"):
        validate_identifier("a" * 65, "field_id")

    with pytest.raises(ValueError, match="field_id must contain only"):
        validate_identifier("field 1", "field_id")

    with pytest.raises(ValueError, match="64 characters"):
        validate_trap_code("a" * 65)

    with pytest.raises(ValueError, match="trap_code must contain only"):
        validate_trap_code("Trap/1")


def test_azure_reference_parsing_and_blob_name() -> None:
    blob_name = build_upload_blob_name("field 1!", "North Edge", date(2026, 5, 4), "../Trap Image.JPG")

    assert blob_name == "field-1/2026/05/04/North-Edge/TrapImage.JPG"
    assert is_azure_storage_reference("azure://uploads/path/to/blob.jpg")
    assert parse_azure_storage_reference("azure://uploads/path/to/blob.jpg") == ("uploads", "path/to/blob.jpg")

    for invalid in ("local/path.jpg", "azure://", "azure://container"):
        with pytest.raises(ValueError, match="Invalid azure storage reference"):
            parse_azure_storage_reference(invalid)


def test_ensure_azure_container_ignores_existing_container() -> None:
    class ExistingContainerClient:
        def create_container(self, container: str) -> None:
            assert container == "uploads"
            raise ResourceExistsError("already exists")

    upload_service_module._ensure_azure_container_exists(ExistingContainerClient(), "uploads")


def test_upload_file_to_azure_blob_uploads_bytes(monkeypatch: pytest.MonkeyPatch, tmp_path: Path) -> None:
    source = tmp_path / "capture.jpg"
    source.write_bytes(JPEG_BYTES)
    calls: dict[str, bytes | str] = {}

    class FakeBlobClient:
        def upload_blob(self, data, overwrite: bool) -> None:  # noqa: ANN001
            calls["payload"] = data.read()
            calls["overwrite"] = str(overwrite)

    class FakeServiceClient:
        def create_container(self, container: str) -> None:
            calls["container"] = container

        def get_blob_client(self, *, container: str, blob: str) -> FakeBlobClient:
            calls["blob_container"] = container
            calls["blob"] = blob
            return FakeBlobClient()

    monkeypatch.setattr(upload_service_module, "_get_blob_service_client", lambda connection_string: FakeServiceClient())

    storage_ref = upload_service_module._upload_file_to_azure_blob(source, "UseDevelopmentStorage=true", "uploads", "field/capture.jpg")

    assert storage_ref == "azure://uploads/field/capture.jpg"
    assert calls == {
        "container": "uploads",
        "blob_container": "uploads",
        "blob": "field/capture.jpg",
        "payload": JPEG_BYTES,
        "overwrite": "True",
    }


def test_download_blob_to_temp_file_reads_blob(monkeypatch: pytest.MonkeyPatch) -> None:
    class FakeDownloader:
        def readall(self) -> bytes:
            return PNG_BYTES

    class FakeBlobClient:
        def download_blob(self) -> FakeDownloader:
            return FakeDownloader()

    class FakeServiceClient:
        def get_blob_client(self, *, container: str, blob: str) -> FakeBlobClient:
            assert container == "uploads"
            assert blob == "field/capture.png"
            return FakeBlobClient()

    monkeypatch.setattr(upload_service_module, "_get_blob_service_client", lambda connection_string: FakeServiceClient())

    temp_path = download_blob_to_temp_file("UseDevelopmentStorage=true", "uploads", "field/capture.png")
    try:
        assert temp_path.suffix == ".png"
        assert temp_path.read_bytes() == PNG_BYTES
    finally:
        temp_path.unlink(missing_ok=True)


def test_save_upload_file_rejects_missing_local_upload_root(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setattr(
        upload_service_module,
        "get_settings",
        lambda: SimpleNamespace(upload_storage_backend="local"),
    )

    with pytest.raises(ValueError, match="UPLOAD_DIR"):
        save_upload_file(None, SimpleNamespace(filename="trap.jpg", file=BytesIO(JPEG_BYTES)))


def test_save_upload_file_rejects_empty_and_oversized_local_uploads(
    monkeypatch: pytest.MonkeyPatch,
    tmp_path: Path,
) -> None:
    monkeypatch.setattr(upload_service_module, "MAX_UPLOAD_SIZE_MB", 0)

    with pytest.raises(ValueError, match="max size"):
        save_upload_file(tmp_path, SimpleNamespace(filename="trap.jpg", file=BytesIO(JPEG_BYTES)))

    monkeypatch.setattr(upload_service_module, "MAX_UPLOAD_SIZE_MB", 20)
    with pytest.raises(ValueError, match="empty"):
        save_upload_file(tmp_path, SimpleNamespace(filename="trap.jpg", file=BytesIO(b"")))


def test_save_upload_file_uses_azure_backend(monkeypatch: pytest.MonkeyPatch) -> None:
    uploaded: dict[str, object] = {}

    monkeypatch.setattr(
        upload_service_module,
        "get_settings",
        lambda: SimpleNamespace(
            upload_storage_backend="azure",
            azure_storage_connection_string="UseDevelopmentStorage=true",
            azure_storage_container="uploads",
        ),
    )

    def fake_upload(temp_path: Path, connection_string: str, container: str, blob_name: str) -> str:
        uploaded["temp_path"] = temp_path
        uploaded["connection_string"] = connection_string
        uploaded["container"] = container
        uploaded["blob_name"] = blob_name
        return f"azure://{container}/{blob_name}"

    monkeypatch.setattr(upload_service_module, "_upload_file_to_azure_blob", fake_upload)

    saved_path, storage_ref, cleanup_path = save_upload_file(
        None,
        SimpleNamespace(filename="trap.jpg", file=BytesIO(JPEG_BYTES)),
        field_id="field-1",
        trap_code="North Edge",
        capture_date=date(2026, 5, 4),
    )
    try:
        assert saved_path == cleanup_path
        assert saved_path.read_bytes() == JPEG_BYTES
        assert storage_ref == "azure://uploads/field-1/2026/05/04/North-Edge/trap.jpg"
        assert uploaded["connection_string"] == "UseDevelopmentStorage=true"
    finally:
        saved_path.unlink(missing_ok=True)


def test_save_upload_file_validates_azure_configuration(monkeypatch: pytest.MonkeyPatch) -> None:
    base = {
        "upload_storage_backend": "azure",
        "azure_storage_connection_string": "",
        "azure_storage_container": "uploads",
    }

    monkeypatch.setattr(upload_service_module, "get_settings", lambda: SimpleNamespace(**base))
    with pytest.raises(ValueError, match="CONNECTION_STRING"):
        save_upload_file(None, SimpleNamespace(filename="trap.jpg", file=BytesIO(JPEG_BYTES)))

    base["azure_storage_connection_string"] = "UseDevelopmentStorage=true"
    base["azure_storage_container"] = ""
    with pytest.raises(ValueError, match="AZURE_STORAGE_CONTAINER"):
        save_upload_file(None, SimpleNamespace(filename="trap.jpg", file=BytesIO(JPEG_BYTES)))

    base["azure_storage_container"] = "uploads"
    with pytest.raises(ValueError, match="requires field_id"):
        save_upload_file(None, SimpleNamespace(filename="trap.jpg", file=BytesIO(JPEG_BYTES)))
