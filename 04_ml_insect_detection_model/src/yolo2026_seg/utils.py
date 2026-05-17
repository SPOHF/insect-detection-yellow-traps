"""Methodology for utils module.

Purpose:
Centralize shared helper logic so train/eval/infer behavior stays consistent
and reproducible.

What this file should implement:
1. Reproducibility helpers:
- Seed setup for python/numpy/torch.
- Deterministic runtime toggles and seed logging.

2. Logging helpers:
- Consistent console/file logging format.
- Structured metric logging per epoch and per fold.

3. Path and artifact helpers:
- Standard directory creation and naming conventions.
- Fold-aware paths for checkpoints, reports, and predictions.

4. Metric utilities:
- Safe averaging/std helpers for CV summaries.
- Utility formatters for report generation.

5. Validation utilities:
- Common assertions for config values and runtime prerequisites.
"""
