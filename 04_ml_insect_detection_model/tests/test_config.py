from pathlib import Path

import pytest

from yolo2026_seg.config import load_infer_config, load_train_config


def test_train_config_requires_data_yaml(tmp_path: Path) -> None:
    p = tmp_path / "bad.yaml"
    p.write_text("epochs: 10\n", encoding="utf-8")
    with pytest.raises(ValueError, match="data_yaml"):
        load_train_config(p)


def test_load_train_and_infer_config_compat_keys(tmp_path: Path) -> None:
    train_p = tmp_path / "train.yaml"
    train_p.write_text(
        "\n".join([
            "data_yaml: data/dataset.yaml",
            "task: detect",
            "model_architecture: yolo11s.pt",
            "img_size: 640",
            "batch_size: 4",
            "learning_rate: 0.0005",
            "optimizer: auto",
            "cos_lr: true",
            "close_mosaic: 5",
            "single_cls: true",
            "cross_validation:",
            "  folds: 3",
        ]),
        encoding="utf-8",
    )
    t = load_train_config(train_p)
    assert t.imgsz == 640
    assert t.task == "detect"
    assert t.batch == 4
    assert t.lr0 == 0.0005
    assert t.close_mosaic == 5
    assert t.single_cls is True
    assert t.cv.folds == 3

    infer_p = tmp_path / "infer.yaml"
    infer_p.write_text(
        "\n".join([
            "model_path: weights/best.pt",
            "task: detect",
            "inputs:",
            "  source_dir: data/infer/images",
            "confidence_threshold: 0.3",
            "outputs:",
            "  output_dir: runs/infer",
        ]),
        encoding="utf-8",
    )
    i = load_infer_config(infer_p)
    assert i.task == "detect"
    assert i.conf == 0.3
    assert i.out_dir == Path("runs/infer")


def test_load_config_parses_false_string_booleans(tmp_path: Path) -> None:
    p = tmp_path / "train.yaml"
    p.write_text(
        "\n".join([
            "data_yaml: data/dataset.yaml",
            "cos_lr: false",
            "single_cls: false",
            "cross_validation:",
            "  enabled: false",
        ]),
        encoding="utf-8",
    )
    cfg = load_train_config(p)
    assert cfg.cos_lr is False
    assert cfg.single_cls is False
    assert cfg.cv.enabled is False


def test_train_config_rejects_unknown_task(tmp_path: Path) -> None:
    p = tmp_path / "bad_task.yaml"
    p.write_text(
        "\n".join([
            "data_yaml: data/dataset.yaml",
            "task: classify",
        ]),
        encoding="utf-8",
    )
    with pytest.raises(ValueError, match="task"):
        load_train_config(p)
