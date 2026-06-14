# Section 04 - ML Insect Detection Model

## Goal
Build a reliable insect detection pipeline for yellow sticky traps, keep segmentation as an optional experiment, and choose the best model using cross-validation.

## Short Methodology
1. Prepare and validate the dataset structure and labels.
2. Split data into K folds (for example 5-fold cross-validation).
3. Train the same model setup on each fold.
4. Evaluate each fold with the same metrics (mAP, precision, recall, segmentation quality).
5. Compare fold results and pick the best overall configuration.
6. Retrain on full training data with the chosen setup.
7. Run final evaluation, inference checks, and export model artifacts.

## Folder Intent
- `configs/`: experiment settings for production detection, YOLOv11 baselines, legacy segmentation, eval, and infer.
- `src/`: modular code for data, model, training, evaluation, inference, and export.
- `tests/`: checks for data loading, training/eval behavior, config validation.
- `weights/`: pretrained and trained model checkpoints.
- `model_docs/`: notes on model decisions, dataset versioning, experiment conclusions, and promotion rules.
