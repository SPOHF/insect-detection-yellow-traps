from pathlib import Path

from yolo2026_seg.data import build_group_folds, load_train_samples


def _write_sample(base: Path, split: str, name: str) -> None:
    (base / "images" / split).mkdir(parents=True, exist_ok=True)
    (base / "labels" / split).mkdir(parents=True, exist_ok=True)
    (base / "images" / split / f"{name}.jpg").write_bytes(b"x")
    (base / "labels" / split / f"{name}.txt").write_text("0 0.5 0.5 0.1 0.1\n", encoding="utf-8")


def test_group_folds_no_leakage(tmp_path: Path) -> None:
    _write_sample(tmp_path, "train", "trapA__001")
    _write_sample(tmp_path, "train", "trapA__002")
    _write_sample(tmp_path, "train", "trapB__001")
    _write_sample(tmp_path, "train", "trapC__001")

    data_yaml = tmp_path / "data.yaml"
    data_yaml.write_text(
        "\n".join([
            f"path: {tmp_path}",
            "train: images/train",
            "val: images/train",
            "names:",
            "  0: insect",
        ]),
        encoding="utf-8",
    )

    samples, _ = load_train_samples(data_yaml, group_delimiter="__")
    folds = build_group_folds(samples, folds=2, seed=42)

    for split in folds:
        train_groups = {s.group for s in split["train"]}
        val_groups = {s.group for s in split["val"]}
        assert train_groups.isdisjoint(val_groups)
