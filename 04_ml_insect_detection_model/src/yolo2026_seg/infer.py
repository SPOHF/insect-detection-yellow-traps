"""Methodology for infer module.

Purpose:
Run production-style prediction on new trap images using the selected best
model from CV.

What this file should implement:
1. Model loading:
- Load the final selected checkpoint and verify class metadata.

2. Inference pipeline:
- Read input images in batches.
- Apply the same preprocessing family used in validation.
- Run model forward pass and confidence/NMS filtering.

3. Output generation:
- Save boxes, classes, confidences, and segmentation masks/polygons.
- Save optional visualization overlays for quick manual review.

4. Operational safety checks:
- Handle unreadable/corrupt images gracefully.
- Log skipped files and inference timing statistics.

5. Export-ready format:
- Write outputs in stable schema (json/csv) for downstream counting and
  analytics.
"""
