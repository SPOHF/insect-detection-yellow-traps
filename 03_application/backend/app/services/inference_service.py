"""
File Purpose: inference service module
Inputs: Imported modules, function arguments, request payloads where applicable.
Outputs: Return values, API responses, and side effects documented in functions/classes.
Process: Implements module-specific business or UI logic.
Authorship: Louis Ferger-Andrews (@LouisFerger-Andrews)
"""

from __future__ import annotations

import logging
import os
from pathlib import Path
from typing import Any, Dict, List

import torch
from ultralytics import YOLO

from app.core.config import get_settings

logger = logging.getLogger(__name__)
ALLOWED_IMAGE_EXTENSIONS = {'.jpg', '.jpeg', '.png', '.webp'}


class InferenceService:
    def __init__(self) -> None:
        self.settings = get_settings()
        self._model: YOLO | None = None
        self._device = self._resolve_device()
        self._configure_mps_limits()

    def _resolve_device(self) -> str:
        configured = getattr(self.settings, 'model_device', 'auto')
        mps_available = hasattr(torch.backends, 'mps') and torch.backends.mps.is_available()
        if configured == 'auto':
            return 'mps' if mps_available else 'cpu'
        if configured == 'mps' and not mps_available:
            logger.warning('MODEL_DEVICE is mps but MPS is unavailable; falling back to cpu')
            return 'cpu'
        return configured

    def _configure_mps_limits(self) -> None:
        if self._device != 'mps':
            return
        ratio = getattr(self.settings, 'model_mps_high_watermark_ratio', 0.7)
        os.environ['PYTORCH_MPS_HIGH_WATERMARK_RATIO'] = str(ratio)

    def _get_model(self) -> YOLO:
        if self._model is None:
            weights_path = Path(self.settings.model_weights_path).resolve()
            if not weights_path.exists():
                raise FileNotFoundError(f'Model weights not found: {weights_path}')
            self._model = YOLO(str(weights_path))
        return self._model

    def run(self, image_path: Path) -> List[Dict[str, Any]]:
        image_path = Path(image_path)
        if not image_path.exists():
            raise ValueError(f'Image not found for inference: {image_path}')
        suffix = image_path.suffix.lower()
        if suffix not in ALLOWED_IMAGE_EXTENSIONS:
            allowed = ', '.join(sorted(ALLOWED_IMAGE_EXTENSIONS))
            raise ValueError(f'Unsupported inference image type "{suffix}". Allowed: {allowed}')

        model = self._get_model()
        try:
            results = model.predict(
                source=str(image_path),
                imgsz=self.settings.model_image_size,
                conf=self.settings.model_confidence,
                device=self._device,
                verbose=False,
            )
        except Exception as exc:
            if self._device != 'cpu':
                logger.warning(
                    'Inference on device=%s failed for image=%s; retrying on cpu',
                    self._device,
                    image_path,
                    exc_info=True,
                )
                try:
                    results = model.predict(
                        source=str(image_path),
                        imgsz=self.settings.model_image_size,
                        conf=self.settings.model_confidence,
                        device='cpu',
                        verbose=False,
                    )
                except Exception as cpu_exc:
                    logger.exception('Inference prediction failed on cpu fallback for image=%s', image_path)
                    raise RuntimeError('Inference prediction failed') from cpu_exc
            else:
                logger.exception('Inference prediction failed for image=%s', image_path)
                raise RuntimeError('Inference prediction failed') from exc

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
