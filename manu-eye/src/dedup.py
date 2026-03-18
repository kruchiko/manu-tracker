import time

EVICTION_INTERVAL = 100


class DeduplicationFilter:
    """Filters out QR codes that were seen within the last `window_seconds`."""

    def __init__(self, window_seconds: float = 30.0) -> None:
        self._window = window_seconds
        self._seen: dict[str, float] = {}
        self._calls_since_eviction = 0

    def filter_new(self, codes: list[str]) -> list[str]:
        """Return only codes not seen within the dedup window."""
        now = time.monotonic()
        self._calls_since_eviction += 1
        if self._calls_since_eviction >= EVICTION_INTERVAL:
            self._evict(now)
            self._calls_since_eviction = 0

        new_codes: list[str] = []
        for code in codes:
            last_seen = self._seen.get(code)
            if last_seen is None or (now - last_seen) > self._window:
                new_codes.append(code)
                self._seen[code] = now
        return new_codes

    def _evict(self, now: float) -> None:
        expired = [k for k, ts in self._seen.items() if (now - ts) > self._window]
        for k in expired:
            del self._seen[k]

    def reset(self) -> None:
        self._seen.clear()
        self._calls_since_eviction = 0
