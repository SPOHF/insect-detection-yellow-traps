# Metadata Validation Rules

## Required fields

- `schema_version`: must be `v1.0.0`
- `field_id`: stable field identifier
- `trap_code`: stable trap identifier within field
- `capture_date`: ISO date (`YYYY-MM-DD`)
- `capture_time`: 24h time (`HH:MM` or `HH:MM:SS`)
- `timezone`: IANA timezone string (`Europe/Berlin`)
- `device_id`: camera or mobile capture device ID
- `operator_id`: user or technician identifier

## Normalization

- Trim leading/trailing spaces for all string values.
- Reject empty strings for required fields.
- Keep `field_id` and `trap_code` case-sensitive and immutable after ingest.

## Temporal consistency

- Reject capture timestamps in the future (with max tolerance 5 minutes).
- Reject malformed timezone values.

## Geospatial consistency

- If `gps` exists, both `lat` and `lon` are required.
- Coordinate bounds must be valid numeric ranges.

## Weather consistency

- Weather fields are optional.
- If provided, values must remain inside schema ranges.

## Error handling expectations

- Validation errors should return a clear field-level message.
- Unknown fields should be rejected to prevent schema drift.
