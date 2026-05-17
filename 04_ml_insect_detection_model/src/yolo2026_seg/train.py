"""Methodology for train module.

Purpose:
Train the segmentation model and select the best configuration using
cross-validation.

What this file should implement:
1. Single-fold training routine:
- Accept fold id and fold-specific train/val split.
- Train with fixed hyperparameters and deterministic seed.
- Save epoch metrics and checkpoints.

2. K-fold loop:
- Iterate folds 1..K and run the same training recipe each time.
- Keep per-fold artifacts in separate directories.

3. Metric tracking:
- Track mAP50, mAP50-95, precision, recall, and segmentation IoU.
- Capture both best-epoch and last-epoch values.

4. Model selection rule:
- Compute mean (and std) of primary metric across folds.
- Choose the best setup by highest mean CV score, not single-fold peak.

5. Final retraining stage:
- Retrain chosen setup on full training data.
- Save final deployable checkpoint and full experiment summary.
"""
