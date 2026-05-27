# Dataset Versioning (MVP + Later)

## Goal
Give every training/evaluation dataset a stable version id so model results can be tied to the exact data used.

## Version Naming
Use this format:
- `field-v###`
- `synthetic-v###`
- `combined-v###`

Examples:
- `field-v001`
- `synthetic-v002`
- `combined-v003`

## Folder Structure
Store versions here:
- `04_ml_insect_detection_model/data/dataset_versions/<dataset_version>/`

Inside each version folder:
- `data.yaml` (YOLO dataset yaml used by training)
- `VERSION.json` (metadata for traceability)
- `CHANGELOG.md` (what changed vs previous version)

## Required Metadata (`VERSION.json`)
Each dataset version must include:
- `dataset_version`
- `dataset_type` (`field` | `synthetic` | `combined`)
- `created_at`
- `created_by`
- `source_paths` (where data came from)
- `label_info` (label source/notes)
- `image_count`
- `label_count`
- `previous_version`

## Change Tracking Rules
When creating a new version:
1. Increment version number (`v001` -> `v002`).
2. Update `CHANGELOG.md` with:
   - images added
   - images removed
   - labels corrected
3. Keep old version folders unchanged (immutable history).

## How Training References a Version
Training must point `data_yaml` to the selected version:

Example in `configs/yolo2026_seg_train.yaml`:
- `data_yaml: 04_ml_insect_detection_model/data/dataset_versions/combined-v003/data.yaml`

This guarantees reproducibility because the exact dataset version is explicit in config and run artifacts.

## MVP Minimum Process
1. Create new version folder from template.
2. Place/update `data.yaml`, `VERSION.json`, `CHANGELOG.md`.
3. Set `data_yaml` in train config to that version.
4. Run training/eval.
5. Keep version folder unchanged after running experiments.
