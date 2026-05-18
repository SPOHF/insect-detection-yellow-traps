from __future__ import annotations

from dataclasses import dataclass
import json
from pathlib import Path
import random
from typing import Any

import yaml

# Keep image support intentionally simple.
IMAGE_EXTS = {".jpg", ".png"}


@dataclass(frozen=True)
class Sample:
    image: Path
    label: Path
    group: str


def load_data_yaml(data_yaml: Path) -> dict[str, Any]:
    with data_yaml.open("r", encoding="utf-8") as f:
        raw = yaml.safe_load(f)
    if not isinstance(raw, dict):
        raise ValueError(f"Invalid data yaml: {data_yaml}")
    return raw


def _resolve(path_root: Path, value: str | list[str]) -> list[Path]:
    values = value if isinstance(value, list) else [value]
    return [(Path(v) if Path(v).is_absolute() else (path_root / v)) for v in values]


def _to_label_path(image_path: Path) -> Path:
    parts = list(image_path.parts)
    idx = parts.index("images")
    parts[idx] = "labels"
    return Path(*parts).with_suffix(".txt")


def _collect_from_roots(roots: list[Path], group_delimiter: str) -> list[Sample]:
    samples: list[Sample] = []
    for root in roots:
        if not root.exists():
            continue
        for image in root.rglob("*"):
            if image.suffix.lower() not in IMAGE_EXTS:
                continue
            label = _to_label_path(image)
            if not label.exists():
                continue
            stem = image.stem
            group = stem.split(group_delimiter)[0] if group_delimiter and group_delimiter in stem else stem
            samples.append(Sample(image=image.resolve(), label=label.resolve(), group=group))

    if not samples:
        raise ValueError("No samples found")
    return sorted(samples, key=lambda s: str(s.image))


def load_train_samples(data_yaml: Path, group_delimiter: str = "__") -> tuple[list[Sample], dict[int, str]]:
    cfg = load_data_yaml(data_yaml)
    root = Path(cfg.get("path", data_yaml.parent))
    if not root.is_absolute():
        root = (data_yaml.parent / root).resolve()

    names = cfg.get("names", {})
    names_map = {int(k): str(v) for k, v in names.items()} if isinstance(names, dict) else {}
    train_roots = _resolve(root, cfg["train"])
    samples = _collect_from_roots(train_roots, group_delimiter)
    return samples, names_map


def build_group_folds(samples: list[Sample], folds: int, seed: int) -> list[dict[str, list[Sample]]]:
    groups: dict[str, list[Sample]] = {}
    for s in samples:
        groups.setdefault(s.group, []).append(s)

    group_ids = list(groups)
    rnd = random.Random(seed)
    rnd.shuffle(group_ids)

    buckets: list[list[str]] = [[] for _ in range(folds)]
    bucket_sizes = [0] * folds
    for gid in group_ids:
        idx = min(range(folds), key=lambda i: bucket_sizes[i])
        buckets[idx].append(gid)
        bucket_sizes[idx] += len(groups[gid])

    out: list[dict[str, list[Sample]]] = []
    for i in range(folds):
        val_groups = set(buckets[i])
        train, val = [], []
        for gid, group_samples in groups.items():
            (val if gid in val_groups else train).extend(group_samples)
        out.append({"train": sorted(train, key=lambda x: str(x.image)), "val": sorted(val, key=lambda x: str(x.image))})
    return out


def write_fold_dataset_yaml(
    *,
    out_dir: Path,
    fold_idx: int,
    split: dict[str, list[Sample]],
    names: dict[int, str],
) -> Path:
    out_dir.mkdir(parents=True, exist_ok=True)
    train_txt = out_dir / f"fold_{fold_idx}_train.txt"
    val_txt = out_dir / f"fold_{fold_idx}_val.txt"
    data_yaml = out_dir / f"fold_{fold_idx}.yaml"

    train_txt.write_text("\n".join(str(s.image) for s in split["train"]) + "\n", encoding="utf-8")
    val_txt.write_text("\n".join(str(s.image) for s in split["val"]) + "\n", encoding="utf-8")

    payload = {"train": str(train_txt), "val": str(val_txt), "names": {int(k): v for k, v in sorted(names.items())}}
    data_yaml.write_text(yaml.safe_dump(payload, sort_keys=False), encoding="utf-8")
    return data_yaml


def write_fold_manifest(out_path: Path, folds: list[dict[str, list[Sample]]]) -> None:
    out_path.parent.mkdir(parents=True, exist_ok=True)
    payload = []
    for i, split in enumerate(folds, start=1):
        payload.append(
            {
                "fold": i,
                "train_count": len(split["train"]),
                "val_count": len(split["val"]),
                "train_images": [str(s.image) for s in split["train"]],
                "val_images": [str(s.image) for s in split["val"]],
            }
        )
    out_path.write_text(json.dumps(payload, indent=2), encoding="utf-8")
