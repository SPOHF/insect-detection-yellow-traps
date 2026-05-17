"""Methodology for postprocess module.

Purpose:
Convert raw model outputs into clean and consistent prediction artifacts.

What this file should implement:
1. Thresholding and filtering:
- Apply confidence and IoU thresholds.
- Remove tiny/noisy masks and invalid polygons.

2. Geometric cleanup:
- Clip boxes/polygons to image bounds.
- Simplify polygons while preserving insect shape quality.

3. De-duplication:
- Merge or suppress overlapping duplicate detections.

4. Derived statistics:
- Compute per-image insect counts and class-wise summaries.

5. Standardized outputs:
- Return normalized structures used by infer export and evaluation tools.
"""
