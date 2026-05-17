"""Methodology for eval module.

Purpose:
Evaluate model quality consistently and make CV-based selection transparent.

What this file should implement:
1. Fold-level evaluation:
- Load each fold's best checkpoint.
- Evaluate on the corresponding validation split only.

2. Metric consistency:
- Use the same metric definitions across all folds.
- Include detection and segmentation metrics.

3. Aggregation:
- Build CV summary with mean, std, min, max per metric.
- Highlight primary selection metric (for example mAP50-95).

4. Error analysis outputs:
- Save confusion patterns and hardest samples.
- Store per-class performance to identify weak insect categories.

5. Decision report:
- Produce machine-readable and human-readable reports used by training
  selection and documentation.
"""
