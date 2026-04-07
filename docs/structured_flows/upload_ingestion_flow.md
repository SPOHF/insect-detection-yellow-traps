# Upload and Ingestion Flow

## Goal
Ingest trap images and metadata into persistent storage and graph/database links.

## Preconditions
- Authenticated user
- Valid field/trap context
- Image and metadata pass validation

## Sequence
1. Client submits upload-range request with images and capture range.
2. API validates request dates and file constraints.
3. Service saves image file to upload storage.
4. Inference service runs detection on saved image.
5. API persists upload + detections in SQL store.
6. Graph service links upload to field/trap timeline.
7. Optional environmental sync backfills context.

## Failure handling
- Validation errors -> HTTP 400 with field-level reason.
- Field/trap permission issues -> HTTP 403/404.
- Inference/storage failures -> HTTP 500 with server logs.
