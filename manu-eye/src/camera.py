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

    cap.set(cv2.CAP_PROP_BUFFERSIZE, 1)

    logger.info("Camera %d opened", camera_index)
    interval_s = interval_ms / 1000.0
    max_consecutive_failures = 10
    try:
        consecutive_failures = 0
        while True:
            for _ in range(4):
                cap.grab()
            ok, frame = cap.read()
            if not ok:
                consecutive_failures += 1
                if consecutive_failures >= max_consecutive_failures:
                    logger.error(
                        "Camera %d: %d consecutive read failures — giving up",
                        camera_index,
                        max_consecutive_failures,
                    )
                    break
                logger.warning(
                    "Camera %d: read failed (%d/%d) — retrying",
                    camera_index,
                    consecutive_failures,
                    max_consecutive_failures,
                )
                time.sleep(interval_s)
                continue
            consecutive_failures = 0
            yield frame
            time.sleep(interval_s)
    finally:
        cap.release()
        logger.info("Camera %d released", camera_index)
