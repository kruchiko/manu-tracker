import logging

import numpy as np

logger = logging.getLogger(__name__)

try:
    from pyzbar.pyzbar import decode as pyzbar_decode, ZBarSymbol

    _HAS_PYZBAR = True
except ImportError:
    _HAS_PYZBAR = False
    logger.warning("pyzbar not available, falling back to OpenCV QR detector")

_opencv_detector = None


def decode_qr_codes(frame: np.ndarray) -> list[str]:
    """Return a list of decoded QR code strings found in the frame."""
    if _HAS_PYZBAR:
        return _decode_pyzbar(frame)
    return _decode_opencv(frame)


def _decode_pyzbar(frame: np.ndarray) -> list[str]:
    results = pyzbar_decode(frame, symbols=[ZBarSymbol.QRCODE])
    codes: list[str] = []
    for r in results:
        text = r.data.decode("utf-8", errors="replace")
        if text:
            codes.append(text)
    return codes


def _decode_opencv(frame: np.ndarray) -> list[str]:
    global _opencv_detector
    if _opencv_detector is None:
        import cv2

        _opencv_detector = cv2.QRCodeDetector()

    retval, decoded_info, _points, _straight_qrcode = _opencv_detector.detectAndDecodeMulti(frame)
    if not retval:
        return []
    return [text for text in decoded_info if text]


def using_pyzbar() -> bool:
    """True when decoding uses zbar (recommended); False when using OpenCV fallback."""
    return _HAS_PYZBAR


def effective_presence_frames_to_arrive(user_setting: int, opencv_floor: int) -> tuple[int, bool]:
    """Return (frames_to_use, whether OpenCV floor raised the configured value).

    OpenCV's ``detectAndDecodeMulti`` can repeat bogus strings across frames;
    requiring a few more consecutive hits than pyzbar reduces ghost arrivals.
    """
    if _HAS_PYZBAR:
        return max(1, user_setting), False
    v = max(user_setting, max(1, opencv_floor))
    return v, v > user_setting
