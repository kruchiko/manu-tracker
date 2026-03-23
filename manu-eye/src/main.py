import json
import logging
import signal
import socket
import sys
import time
from datetime import datetime, timezone

import httpx

from src.client import BackendClient, StationInfo
from src.camera import capture_frames
from src.config import get_settings
from src.decoder import decode_qr_codes, effective_presence_frames_to_arrive, using_pyzbar
from src.presence import PresenceTracker
from src.tray_codes import filter_tray_codes


class _JsonFormatter(logging.Formatter):
    def format(self, record: logging.LogRecord) -> str:
        entry = {
            "time": datetime.now(timezone.utc).isoformat(),
            "level": record.levelname.lower(),
            "logger": record.name,
            "msg": record.getMessage(),
        }
        if record.exc_info and record.exc_info[1]:
            entry["error"] = str(record.exc_info[1])
        return json.dumps(entry)


def _configure_logging() -> None:
    handler = logging.StreamHandler(sys.stderr)
    handler.setFormatter(_JsonFormatter())
    root = logging.getLogger()
    root.handlers.clear()
    root.addHandler(handler)
    root.setLevel(logging.INFO)


logger = logging.getLogger(__name__)

REGISTER_RETRY_SECONDS = 5

_shutdown_requested = False


def _handle_sigterm(_signum: int, _frame: object) -> None:
    global _shutdown_requested
    _shutdown_requested = True


signal.signal(signal.SIGTERM, _handle_sigterm)


def wait_for_registration(client: BackendClient, eye_id: str) -> StationInfo:
    """Keep trying to register until the backend assigns this eye to a station."""
    hostname = socket.gethostname()
    while not _shutdown_requested:
        try:
            info = client.register_eye(eye_id, hostname)
            logger.info(
                "Registered: eye=%s station=%s (%s)",
                eye_id,
                info.station_id,
                info.station_name,
            )
            return info
        except httpx.HTTPStatusError as exc:
            if exc.response.status_code == 404:
                logger.info(
                    "Eye %s not assigned to a station yet — retrying in %ds",
                    eye_id,
                    REGISTER_RETRY_SECONDS,
                )
            else:
                logger.error("Registration failed: %s", exc)
            time.sleep(REGISTER_RETRY_SECONDS)
        except httpx.HTTPError as exc:
            logger.error("Cannot reach backend: %s — retrying in %ds", exc, REGISTER_RETRY_SECONDS)
            time.sleep(REGISTER_RETRY_SECONDS)
    raise SystemExit(0)


def run() -> None:
    _configure_logging()
    settings = get_settings()
    client = BackendClient(settings.backend_url)

    try:
        station = wait_for_registration(client, settings.eye_id)
        arrive_frames, bumped = effective_presence_frames_to_arrive(
            settings.presence_frames_arrive,
            settings.opencv_arrive_frames_floor,
        )
        if not using_pyzbar():
            if bumped:
                logger.warning(
                    "OpenCV QR fallback: presence_frames_arrive raised from %d to %d — "
                    "install pyzbar + system zbar for reliable detection (tune OPENCV_ARRIVE_FRAMES_FLOOR if needed)",
                    settings.presence_frames_arrive,
                    arrive_frames,
                )
            else:
                logger.warning(
                    "OpenCV QR fallback — install pyzbar + zbar for production; "
                    "increase PRESENCE_FRAMES_ARRIVE or OPENCV_ARRIVE_FRAMES_FLOOR if you still see ghost arrivals",
                )

        presence = PresenceTracker(
            frames_to_arrive=arrive_frames,
            frames_to_depart=settings.presence_frames_depart,
            miss_grace=settings.presence_miss_grace,
        )

        logger.info(
            "Starting capture loop: camera=%d interval=%dms presence_arrive=%d frames depart=%d frames (pyzbar=%s)",
            settings.camera_index,
            settings.frame_interval_ms,
            arrive_frames,
            settings.presence_frames_depart,
            using_pyzbar(),
        )

        for frame in capture_frames(settings.camera_index, settings.frame_interval_ms):
            if _shutdown_requested:
                break

            raw_codes = decode_qr_codes(frame)
            codes = filter_tray_codes(raw_codes)

            if logger.isEnabledFor(logging.DEBUG):
                logger.debug("decode: raw=%s filtered=%s present=%s", raw_codes, codes, presence.stable_present_codes)

            for transition in presence.process_frame(codes):
                captured_at = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%S.%f")[:-3] + "Z"
                try:
                    client.send_event(
                        tray_code=transition.tray_code,
                        station_id=station.station_id,
                        eye_id=settings.eye_id,
                        captured_at=captured_at,
                        phase=transition.phase,
                    )
                except httpx.HTTPError as exc:
                    logger.error(
                        "Failed to send event for %s (%s): %s",
                        transition.tray_code,
                        transition.phase,
                        exc,
                    )
    finally:
        client.close()


def main() -> None:
    try:
        run()
    except KeyboardInterrupt:
        logger.info("Shutting down")
        sys.exit(0)


if __name__ == "__main__":
    main()
