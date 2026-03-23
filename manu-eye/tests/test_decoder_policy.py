"""Decoder-backed policy helpers (OpenCV vs pyzbar)."""

import pytest


def test_effective_arrive_respects_user_when_pyzbar(monkeypatch: pytest.MonkeyPatch) -> None:
    import src.decoder as dec

    monkeypatch.setattr(dec, "_HAS_PYZBAR", True)
    v, bumped = dec.effective_presence_frames_to_arrive(3, opencv_floor=99)
    assert v == 3
    assert bumped is False


def test_effective_arrive_applies_opencv_floor(monkeypatch: pytest.MonkeyPatch) -> None:
    import src.decoder as dec

    monkeypatch.setattr(dec, "_HAS_PYZBAR", False)
    v, bumped = dec.effective_presence_frames_to_arrive(2, opencv_floor=15)
    assert v == 15
    assert bumped is True


def test_effective_arrive_user_above_floor_opencv(monkeypatch: pytest.MonkeyPatch) -> None:
    import src.decoder as dec

    monkeypatch.setattr(dec, "_HAS_PYZBAR", False)
    v, bumped = dec.effective_presence_frames_to_arrive(20, opencv_floor=15)
    assert v == 20
    assert bumped is False
