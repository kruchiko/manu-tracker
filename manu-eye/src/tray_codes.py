"""Validate decoded QR payloads before presence tracking.

OpenCV's ``detectAndDecodeMulti`` often returns bogus strings from noise; requiring the
same shape as manu-gen order tray labels drops almost all false positives.
"""

from __future__ import annotations

import re

# Matches manu-gen ``formatTrayCode``: TRAY-0001, TRAY-12345, etc.
_TRAY_CODE_RE = re.compile(r"^TRAY-[0-9]{4,}$")


def is_valid_tray_code(raw: str) -> bool:
    """Return True if ``raw`` looks like a backend tray label (after strip)."""
    s = raw.strip()
    return bool(_TRAY_CODE_RE.fullmatch(s))


def filter_tray_codes(codes: list[str]) -> list[str]:
    """Keep only strings that match the tray code pattern (order preserved, de-duplicated per frame)."""
    seen: set[str] = set()
    out: list[str] = []
    for c in codes:
        s = c.strip()
        if not is_valid_tray_code(s) or s in seen:
            continue
        seen.add(s)
        out.append(s)
    return out
