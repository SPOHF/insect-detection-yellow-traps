from __future__ import annotations

from pathlib import Path
from typing import Any

from .config import InferConfig
from .model import build_model
from .utils import dump_json, ensure_dir, to_float


def _extract_prediction(result: Any) -> dict[str, Any]:
    boxes = result.boxes
    names = result.names
    rows = []

    if boxes is None:
        return {"image": str(result.path), "detections": []}

    xyxy = boxes.xyxy.cpu().numpy() if boxes.xyxy is not None else []
    conf = boxes.conf.cpu().numpy() if boxes.conf is not None else []
    cls = boxes.cls.cpu().numpy() if boxes.cls is not None else []

    for i in range(len(conf)):
        cid = int(cls[i])
        rows.append(
            {
                "class_id": cid,
                "class_name": str(names.get(cid, cid)),
                "confidence": to_float(conf[i]),
                "bbox_xyxy": [to_float(v) for v in xyxy[i]],
            }
        )

    return {"image": str(result.path), "detections": rows}


def run_inference(cfg: InferConfig) -> Path:
    ensure_dir(cfg.out_dir)
    model = build_model(str(cfg.model_path))

    results = model.predict(
        source=str(cfg.source),
        task="segment",
        imgsz=cfg.imgsz,
        conf=cfg.conf,
        iou=cfg.iou,
        max_det=cfg.max_det,
        device=cfg.device or None,
        save=cfg.save_vis,
        project=str(cfg.out_dir),
        name="predict",
        exist_ok=True,
        verbose=False,
    )

    payload = [_extract_prediction(r) for r in results]
    out_json = cfg.out_dir / "predictions.json"
    dump_json(out_json, payload)
    return out_json
