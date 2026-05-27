from yolo2026_seg.infer import _extract_prediction


class _Arr:
    def __init__(self, val):
        self._val = val

    def cpu(self):
        return self

    def numpy(self):
        return self._val


class _Boxes:
    def __init__(self):
        self.xyxy = _Arr([[1, 2, 3, 4]])
        self.conf = _Arr([0.9])
        self.cls = _Arr([0])


class _Result:
    path = "img.jpg"
    names = {0: "insect"}
    boxes = _Boxes()


def test_extract_prediction_shape() -> None:
    out = _extract_prediction(_Result())
    assert out["image"] == "img.jpg"
    assert out["detections"][0]["class_name"] == "insect"
