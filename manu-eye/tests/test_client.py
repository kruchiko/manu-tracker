import json

import httpx
import pytest

from src.client import BackendClient, StationInfo


def test_register_eye_success(httpx_mock) -> None:
    httpx_mock.add_response(
        url="http://localhost:3000/eyes/register",
        method="POST",
        json={"stationId": "station-abc", "stationName": "Polishing"},
    )

    client = BackendClient("http://localhost:3000")
    result = client.register_eye("eye-1")
    client.close()

    assert result == StationInfo(station_id="station-abc", station_name="Polishing")


def test_register_eye_sends_correct_payload(httpx_mock) -> None:
    httpx_mock.add_response(
        url="http://localhost:3000/eyes/register",
        method="POST",
        json={"stationId": "station-abc", "stationName": "Polishing"},
    )

    client = BackendClient("http://localhost:3000")
    client.register_eye("eye-1", hostname="pi-01")
    client.close()

    request = httpx_mock.get_request()
    assert request is not None
    body = json.loads(request.content)
    assert body == {"eyeId": "eye-1", "hostname": "pi-01"}


def test_register_eye_404_raises(httpx_mock) -> None:
    httpx_mock.add_response(
        url="http://localhost:3000/eyes/register",
        method="POST",
        status_code=404,
        json={"error": "No station assigned"},
    )

    client = BackendClient("http://localhost:3000")
    with pytest.raises(httpx.HTTPStatusError):
        client.register_eye("eye-unknown")
    client.close()


def test_send_event_success(httpx_mock) -> None:
    httpx_mock.add_response(
        url="http://localhost:3000/events",
        method="POST",
        status_code=201,
        json={"id": 1},
    )

    client = BackendClient("http://localhost:3000")
    client.send_event(
        tray_code="TRAY-0001",
        station_id="station-abc",
        eye_id="eye-1",
        captured_at="2026-03-18T14:30:00.000Z",
    )
    client.close()


def test_send_event_sends_correct_payload(httpx_mock) -> None:
    httpx_mock.add_response(
        url="http://localhost:3000/events",
        method="POST",
        status_code=201,
        json={"id": 1},
    )

    client = BackendClient("http://localhost:3000")
    client.send_event(
        tray_code="TRAY-0001",
        station_id="station-abc",
        eye_id="eye-1",
        captured_at="2026-03-18T14:30:00.000Z",
    )
    client.close()

    request = httpx_mock.get_request()
    assert request is not None
    body = json.loads(request.content)
    assert body == {
        "trayCode": "TRAY-0001",
        "stationId": "station-abc",
        "eyeId": "eye-1",
        "capturedAt": "2026-03-18T14:30:00.000Z",
    }


def test_send_event_server_error_raises(httpx_mock) -> None:
    httpx_mock.add_response(
        url="http://localhost:3000/events",
        method="POST",
        status_code=500,
        json={"error": "Internal server error"},
    )

    client = BackendClient("http://localhost:3000")
    with pytest.raises(httpx.HTTPStatusError):
        client.send_event(
            tray_code="TRAY-0001",
            station_id="station-abc",
            eye_id="eye-1",
            captured_at="2026-03-18T14:30:00.000Z",
        )
    client.close()
