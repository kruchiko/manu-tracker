import numpy as np
import pytest
import qrcode

from src.decoder import decode_qr_codes, _decode_pyzbar, _HAS_PYZBAR


def _make_blank_frame(width: int = 640, height: int = 480) -> np.ndarray:
    return np.zeros((height, width, 3), dtype=np.uint8)


def _make_qr_frame(text: str, size: int = 400) -> np.ndarray:
    """Generate a BGR frame containing a QR code with the given text."""
    img = qrcode.make(text).resize((size, size))
    gray = np.array(img, dtype=np.uint8) * 255
    bgr = np.stack([gray, gray, gray], axis=-1)
    padding = 120
    frame = np.ones((size + 2 * padding, size + 2 * padding, 3), dtype=np.uint8) * 255
    frame[padding : padding + size, padding : padding + size] = bgr
    return frame


def test_blank_frame_returns_no_codes() -> None:
    frame = _make_blank_frame()
    codes = decode_qr_codes(frame)
    assert codes == []


@pytest.mark.skipif(not _HAS_PYZBAR, reason="pyzbar not installed")
def test_pyzbar_blank_frame_returns_no_codes() -> None:
    frame = _make_blank_frame()
    codes = _decode_pyzbar(frame)
    assert codes == []


def test_decode_returns_list_type() -> None:
    frame = _make_blank_frame()
    result = decode_qr_codes(frame)
    assert isinstance(result, list)


def test_decode_finds_qr_code_in_frame() -> None:
    frame = _make_qr_frame("TRAY-0042")
    codes = decode_qr_codes(frame)
    assert "TRAY-0042" in codes


@pytest.mark.skipif(not _HAS_PYZBAR, reason="pyzbar not installed")
def test_pyzbar_finds_qr_code_in_frame() -> None:
    frame = _make_qr_frame("TRAY-0042")
    codes = _decode_pyzbar(frame)
    assert "TRAY-0042" in codes
