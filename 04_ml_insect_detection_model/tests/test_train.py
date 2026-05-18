from yolo2026_seg.train import _extract_metrics


class _Results:
    results_dict = {
        "metrics/mAP50(B)": 0.55,
        "metrics/mAP50-95(B)": 0.34,
        "metrics/precision(B)": 0.88,
        "metrics/recall(B)": 0.79,
        "metrics/mAP50(M)": 0.51,
        "metrics/mAP50-95(M)": 0.3,
    }


def test_extract_metrics_keys() -> None:
    out = _extract_metrics(_Results())
    assert out["map50"] == 0.55
    assert out["seg_map50_95"] == 0.3
