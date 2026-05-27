from __future__ import annotations

from ultralytics import YOLO


def build_model(model_ref: str) -> YOLO:
    # model_ref can be a checkpoint (e.g., yolo26m-seg.pt) or model yaml.
    return YOLO(model_ref)
