"""Methodology for model module.

Purpose:
Create and configure the YOLO segmentation model used across all folds.

What this file should implement:
1. Model factory:
- Build model from architecture name (for example yolov8n-seg).
- Optionally load pretrained weights.

2. Head and class configuration:
- Set number of classes from dataset config.
- Ensure segmentation head matches label format and mask settings.

3. Reproducibility controls:
- Keep architecture and initialization identical across folds.
- Log full model config/hash for traceability.

4. Runtime options:
- Support CPU/GPU selection, mixed precision, and compile/acceleration flags.

5. Checkpoint compatibility:
- Provide clean load/save routines so train/eval/infer use the same format.
"""
