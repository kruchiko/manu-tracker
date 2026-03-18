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
from src.decoder import decode_qr_codes
from src.dedup import DeduplicationFilter


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
        dedup = DeduplicationFilter(window_seconds=settings.dedup_window_seconds)

        logger.info(
            "Starting capture loop: camera=%d interval=%dms dedup=%ds",
            settings.camera_index,
            settings.frame_interval_ms,
            settings.dedup_window_seconds,
        )

        for frame in capture_frames(settings.camera_index, settings.frame_interval_ms):
            if _shutdown_requested:
                break

            codes = decode_qr_codes(frame)
            new_codes = dedup.filter_new(codes)

            for code in new_codes:
                captured_at = datetime.now(timezone.utc).isoformat()
                try:
                    client.send_event(
                        tray_code=code,
                        station_id=station.station_id,
                        eye_id=settings.eye_id,
                        captured_at=captured_at,
                    )
                except httpx.HTTPError as exc:
                    logger.error("Failed to send event for %s: %s", code, exc)
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
