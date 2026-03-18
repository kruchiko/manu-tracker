from unittest.mock import patch

from src.dedup import DeduplicationFilter, EVICTION_INTERVAL


def test_first_sighting_passes_through() -> None:
    f = DeduplicationFilter(window_seconds=30)
    result = f.filter_new(["TRAY-0001"])
    assert result == ["TRAY-0001"]


def test_duplicate_within_window_is_filtered() -> None:
    f = DeduplicationFilter(window_seconds=30)
    f.filter_new(["TRAY-0001"])
    result = f.filter_new(["TRAY-0001"])
    assert result == []


def test_duplicate_after_window_passes_through() -> None:
    f = DeduplicationFilter(window_seconds=5)
    base_time = 1000.0

    with patch("src.dedup.time.monotonic", return_value=base_time):
        f.filter_new(["TRAY-0001"])

    with patch("src.dedup.time.monotonic", return_value=base_time + 6):
        result = f.filter_new(["TRAY-0001"])

    assert result == ["TRAY-0001"]


def test_multiple_codes_filtered_independently() -> None:
    f = DeduplicationFilter(window_seconds=30)
    result1 = f.filter_new(["TRAY-0001", "TRAY-0002"])
    assert result1 == ["TRAY-0001", "TRAY-0002"]

    result2 = f.filter_new(["TRAY-0001", "TRAY-0003"])
    assert result2 == ["TRAY-0003"]


def test_reset_clears_history() -> None:
    f = DeduplicationFilter(window_seconds=30)
    f.filter_new(["TRAY-0001"])
    f.reset()
    result = f.filter_new(["TRAY-0001"])
    assert result == ["TRAY-0001"]


def test_eviction_removes_expired_entries() -> None:
    f = DeduplicationFilter(window_seconds=5)
    base_time = 1000.0

    with patch("src.dedup.time.monotonic", return_value=base_time):
        f.filter_new(["TRAY-0001"])

    assert "TRAY-0001" in f._seen

    f._calls_since_eviction = EVICTION_INTERVAL - 1
    with patch("src.dedup.time.monotonic", return_value=base_time + 10):
        f.filter_new([])

    assert "TRAY-0001" not in f._seen
