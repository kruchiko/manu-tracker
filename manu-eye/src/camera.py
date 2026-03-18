import logging
import time
from collections.abc import Generator

import cv2
import numpy as np

logger = logging.getLogger(__name__)


def capture_frames(
    camera_index: int = 0,
    interval_ms: int = 500,
) -> Generator[np.ndarray, None, None]:
    """Yield frames from a webcam at the given interval.

    Opens the camera once and yields BGR frames. The caller is responsible
    for breaking out of the loop to release the camera.
    """
    cap = cv2.VideoCapture(camera_index)
    if not cap.isOpened():
        raise RuntimeError(f"Cannot open camera at index {camera_index}")

    logger.info("Camera %d opened", camera_index)
    interval_s = interval_ms / 1000.0
    try:
        while True:
            ok, frame = cap.read()
            if not ok:
                logger.warning("Failed to read frame from camera %d", camera_index)
                break
            yield frame
            time.sleep(interval_s)
    finally:
        cap.release()
        logger.info("Camera %d released", camera_index)
