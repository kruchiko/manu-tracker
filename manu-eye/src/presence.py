"""Stable presence detection per tray QR: emit edges only on placed / removed."""

from __future__ import annotations

from dataclasses import dataclass
from typing import Literal


@dataclass(frozen=True)
class PresenceTransition:
    """One edge to report to the backend."""

    phase: Literal["arrived", "departed"]
    tray_code: str


class PresenceTracker:
    """Per-code hysteresis: N consecutive frames with decode -> arrived; M without -> departed.

    While a tray is stably under the camera, **no** transitions are emitted.

    ``miss_grace`` allows up to that many *non-consecutive* missed frames during the
    arrival streak without resetting it.  Each miss decrements the streak by 1 (min 0)
    instead of zeroing it, so a brief decode failure doesn't restart the full wait.
    """

    def __init__(
        self,
        frames_to_arrive: int = 2,
        frames_to_depart: int = 5,
        miss_grace: int = 1,
    ) -> None:
        if frames_to_arrive < 1:
            raise ValueError("frames_to_arrive must be >= 1")
        if frames_to_depart < 1:
            raise ValueError("frames_to_depart must be >= 1")
        if miss_grace < 0:
            raise ValueError("miss_grace must be >= 0")
        self._n = frames_to_arrive
        self._m = frames_to_depart
        self._miss_grace = miss_grace
        self._present: set[str] = set()
        self._present_streak: dict[str, int] = {}
        self._present_misses: dict[str, int] = {}
        self._absent_streak: dict[str, int] = {}

    @property
    def stable_present_codes(self) -> frozenset[str]:
        """Tray codes currently in the stably-present set (after ``arrived``, before ``departed``)."""
        return frozenset(self._present)

    def process_frame(self, codes: list[str]) -> list[PresenceTransition]:
        """Return transitions caused by this frame (usually 0 or 1 per code)."""
        current = set(codes)
        out: list[PresenceTransition] = []

        for code in list(self._present):
            if code in current:
                self._absent_streak.pop(code, None)
            else:
                prev = self._absent_streak.get(code, 0) + 1
                self._absent_streak[code] = prev
                if prev >= self._m:
                    out.append(PresenceTransition(phase="departed", tray_code=code))
                    self._present.discard(code)
                    del self._absent_streak[code]
                    self._present_streak.pop(code, None)
                    self._present_misses.pop(code, None)

        for code in current:
            if code in self._present:
                continue
            self._present_misses.pop(code, None)
            prev = self._present_streak.get(code, 0) + 1
            self._present_streak[code] = prev
            if prev >= self._n:
                out.append(PresenceTransition(phase="arrived", tray_code=code))
                self._present.add(code)
                del self._present_streak[code]
                self._present_misses.pop(code, None)

        for code in list(self._present_streak.keys()):
            if code not in current:
                misses = self._present_misses.get(code, 0) + 1
                if misses > self._miss_grace:
                    del self._present_streak[code]
                    self._present_misses.pop(code, None)
                else:
                    self._present_misses[code] = misses
                    self._present_streak[code] = max(0, self._present_streak[code] - 1)

        return out
