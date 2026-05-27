from yolo2026_seg.eval import summarize_folds


def test_summarize_folds_best_selection() -> None:
    payload = summarize_folds(
        [
            {"map50_95": 0.31, "precision": 0.7},
            {"map50_95": 0.42, "precision": 0.6},
            {"map50_95": 0.40, "precision": 0.8},
        ],
        primary_metric="map50_95",
    )
    assert payload["best_fold"] == 2
    rows = {row["metric"]: row for row in payload["summary"]}
    assert rows["map50_95"]["max"] == 0.42
