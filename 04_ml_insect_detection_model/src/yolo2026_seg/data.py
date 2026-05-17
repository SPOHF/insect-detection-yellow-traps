"""Methodology for data module.

Purpose:
Prepare clean and reproducible training/evaluation inputs for insect
segmentation.

What this file should implement:
1. Dataset discovery:
- Find image files and matching label/mask files.
- Enforce expected folder structure and file naming.

2. Data quality checks:
- Verify every image has a valid annotation.
- Validate class ids, polygon coordinates, and image dimensions.
- Report and skip or fail on broken samples (configurable strict mode).

3. Split strategy with cross-validation:
- Build K folds (default 5) using a deterministic random seed.
- Prefer stratified folds by insect class/count when possible.
- Prevent data leakage (same trap/day/series should stay in one fold group).

4. Loader preparation:
- Build train/val loaders for each fold.
- Apply train-only augmentations; keep validation preprocessing minimal.

5. Fold manifest outputs:
- Save fold membership files so experiments are reproducible and auditable.
"""
