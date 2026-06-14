# Model Strengthening Plan

## Decision
The production application should use a YOLO detection model for the next iteration. The backend stores bounding boxes and class ids, so a detection-first model is safer than promoting a segmentation checkpoint until mask outputs are supported end-to-end.

## What We Learned From SPoHF-Yolo-V11
- Keep a YOLOv11 nano baseline because it is fast and easy to compare.
- Use longer patience for small insect datasets where validation metrics can move slowly.
- Keep image size at 1024 for yellow-trap images because small insects need more resolution.
- Avoid a fixed high confidence threshold such as 0.70 for counting; validate confidence and IoU against labeled counts.
- Keep MPS optional because Apple Metal can be unstable for long training runs.

## Current Improvements
- Added a production detection config: `configs/swd_yolo_detect_train.yaml`.
- Added a YOLOv11 nano benchmark config: `configs/swd_yolo11n_baseline_train.yaml`.
- Kept the old segmentation config as a legacy experiment only.
- Added configurable `task`, `optimizer`, `cos_lr`, `close_mosaic`, and `single_cls` training options.
- Aligned training image extension support with production inference image support.

## Promotion Rule
Do not replace the deployed model only because a newer YOLO version exists. Promote a checkpoint only when it beats the current runtime model on the same frozen test set for:

1. `mAP50-95`
2. recall
3. count error
4. visual false-positive review on dense yellow-trap images

## Recommended Next Experiment
Train these two configs on the same immutable dataset version:

```bash
python -m cli.main train --config 04_ml_insect_detection_model/configs/swd_yolo_detect_train.yaml
python -m cli.main train --config 04_ml_insect_detection_model/configs/swd_yolo11n_baseline_train.yaml
```

Then compare their `cv_summary.json` files before touching the deployed app model in `03_application/poc-model/swd_yolo_best.pt`.
