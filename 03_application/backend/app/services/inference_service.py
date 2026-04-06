from __future__ import annotations

from pathlib import Path
from typing import Any, Dict, List

from ultralytics import YOLO

from app.core.config import get_settings


class InferenceService:
    def __init__(self) -> None:
        self.settings = get_settings()
        self._model: YOLO | None = None

    def _get_model(self) -> YOLO:
        if self._model is None:
            weights_path = Path(self.settings.model_weights_path).resolve()
            if not weights_path.exists():
                raise FileNotFoundError(f'Model weights not found: {weights_path}')
            self._model = YOLO(str(weights_path))
        return self._model

    def run(self, image_path: Path) -> List[Dict[str, Any]]:
        model = self._get_model()
        results = model.predict(
            source=str(image_path),
            imgsz=self.settings.model_image_size,
            conf=self.settings.model_confidence,
            verbose=False,
        )
        detections: List[Dict[str, Any]] = []
        if not results:
            return detections

        for box in results[0].boxes:
            xyxy = box.xyxy[0].tolist()
            detections.append(
                {
                    'bbox_xyxy': [float(value) for value in xyxy],
                    'confidence': float(box.conf[0]),
                    'class_id': int(box.cls[0]),
                }
            )
        return detections
