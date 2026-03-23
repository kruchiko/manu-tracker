"""Tray code validation (filters OpenCV garbage)."""

from src.tray_codes import filter_tray_codes, is_valid_tray_code


def test_accepts_manu_gen_tray_labels() -> None:
    assert is_valid_tray_code("TRAY-0001") is True
    assert is_valid_tray_code("TRAY-12345") is True
    assert is_valid_tray_code("  TRAY-0001  ") is True


def test_rejects_short_numeric_suffix() -> None:
    assert is_valid_tray_code("TRAY-1") is False
    assert is_valid_tray_code("TRAY-12") is False
    assert is_valid_tray_code("TRAY-123") is False


def test_rejects_garbage_opencv_might_return() -> None:
    assert is_valid_tray_code("") is False
    assert is_valid_tray_code("http://example.com") is False
    assert is_valid_tray_code("random noise") is False
    assert is_valid_tray_code("tray-0001") is False
    assert is_valid_tray_code("TRAY-00a1") is False


def test_filter_tray_codes_dedupes_frame() -> None:
    assert filter_tray_codes(["TRAY-0001", "TRAY-0001", "TRAY-0002"]) == ["TRAY-0001", "TRAY-0002"]


def test_filter_tray_codes_drops_invalid() -> None:
    assert filter_tray_codes(["nope", "TRAY-0001", ""]) == ["TRAY-0001"]
