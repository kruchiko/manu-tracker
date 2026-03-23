import logging
from dataclasses import dataclass

import httpx

logger = logging.getLogger(__name__)

REQUEST_TIMEOUT = 10.0


@dataclass(frozen=True)
class StationInfo:
    station_id: str
    station_name: str


class BackendClient:
    """HTTP client for the manu-gen backend. Reuses a single TCP connection."""

    def __init__(self, backend_url: str) -> None:
        self._client = httpx.Client(base_url=backend_url, timeout=REQUEST_TIMEOUT)

    def register_eye(self, eye_id: str, hostname: str = "") -> StationInfo:
        """Register this eye with the backend. Returns assigned station info.

        Raises httpx.HTTPStatusError on non-2xx responses.
        """
        response = self._client.post(
            "/eyes/register",
            json={"eyeId": eye_id, "hostname": hostname},
        )
        response.raise_for_status()
        data = response.json()
        return StationInfo(station_id=data["stationId"], station_name=data["stationName"])

    def send_event(
        self,
        tray_code: str,
        station_id: str,
        eye_id: str,
        captured_at: str,
        phase: str,
    ) -> None:
        """POST a tracking event to the backend."""
        response = self._client.post(
            "/events",
            json={
                "trayCode": tray_code,
                "stationId": station_id,
                "eyeId": eye_id,
                "capturedAt": captured_at,
                "phase": phase,
            },
        )
        response.raise_for_status()
        logger.info("Event sent: tray=%s station=%s phase=%s", tray_code, station_id, phase)

    def close(self) -> None:
        self._client.close()
