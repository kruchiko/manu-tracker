"""Tests for stable presence (placed / stayed / removed) per tray QR."""

from src.presence import PresenceTracker


def test_should_emit_nothing_while_tray_stays_visible() -> None:
    t = PresenceTracker(frames_to_arrive=1, frames_to_depart=5)
    assert len(t.process_frame(["A"])) == 1
    for _ in range(10):
        assert t.process_frame(["A"]) == []


def test_should_emit_arrived_after_n_frames_then_nothing() -> None:
    t = PresenceTracker(frames_to_arrive=2, frames_to_depart=3)
    assert t.process_frame(["T1"]) == []
    out = t.process_frame(["T1"])
    assert len(out) == 1
    assert out[0].phase == "arrived"
    assert out[0].tray_code == "T1"
    assert t.process_frame(["T1"]) == []


def test_should_reset_arrival_streak_after_too_many_misses() -> None:
    t = PresenceTracker(frames_to_arrive=3, frames_to_depart=2, miss_grace=0)
    t.process_frame(["X"])
    t.process_frame(["X"])
    t.process_frame([])  # miss_grace=0 → streak reset
    assert t.process_frame(["X"]) == []
    assert t.process_frame(["X"]) == []
    out = t.process_frame(["X"])
    assert len(out) == 1 and out[0].phase == "arrived"


def test_miss_grace_allows_single_missed_frame() -> None:
    t = PresenceTracker(frames_to_arrive=3, frames_to_depart=5, miss_grace=1)
    t.process_frame(["X"])  # streak=1
    t.process_frame(["X"])  # streak=2
    t.process_frame([])     # miss 1 (within grace) → streak decremented to 1
    t.process_frame(["X"])  # streak=2
    out = t.process_frame(["X"])  # streak=3 → arrived
    assert len(out) == 1 and out[0].phase == "arrived"


def test_miss_grace_resets_after_two_misses_when_grace_is_one() -> None:
    t = PresenceTracker(frames_to_arrive=4, frames_to_depart=5, miss_grace=1)
    t.process_frame(["X"])  # streak=1
    t.process_frame(["X"])  # streak=2
    t.process_frame([])     # miss 1 (grace) → streak=1
    t.process_frame([])     # miss 2 (exceeds grace) → streak wiped
    # Fully reset — need 4 fresh frames
    t.process_frame(["X"])
    t.process_frame(["X"])
    t.process_frame(["X"])
    out = t.process_frame(["X"])
    assert len(out) == 1 and out[0].phase == "arrived"


def test_should_emit_departed_after_m_absent_frames() -> None:
    t = PresenceTracker(frames_to_arrive=1, frames_to_depart=2)
    assert len(t.process_frame(["T"])) == 1
    assert t.process_frame([]) == []
    out = t.process_frame([])
    assert len(out) == 1
    assert out[0].phase == "departed"
    assert out[0].tray_code == "T"


def test_stable_present_codes_reflects_state() -> None:
    t = PresenceTracker(frames_to_arrive=1, frames_to_depart=2)
    assert t.stable_present_codes == frozenset()
    t.process_frame(["T"])
    assert t.stable_present_codes == frozenset({"T"})


def test_should_track_two_trays_independently() -> None:
    t = PresenceTracker(frames_to_arrive=1, frames_to_depart=2)
    out1 = t.process_frame(["A", "B"])
    assert len(out1) == 2
    assert {x.tray_code for x in out1} == {"A", "B"}
    assert all(x.phase == "arrived" for x in out1)

    assert t.process_frame(["A", "B"]) == []

    assert t.process_frame(["A"]) == []
    out_b = t.process_frame(["A"])
    assert len(out_b) == 1
    assert out_b[0].tray_code == "B" and out_b[0].phase == "departed"

    assert t.process_frame([]) == []
    out_a = t.process_frame([])
    assert len(out_a) == 1
    assert out_a[0].tray_code == "A" and out_a[0].phase == "departed"


def test_re_arrival_after_departure() -> None:
    t = PresenceTracker(frames_to_arrive=1, frames_to_depart=2)
    t.process_frame(["T"])
    t.process_frame([])
    t.process_frame([])  # departed
    out = t.process_frame(["T"])
    assert len(out) == 1 and out[0].phase == "arrived"
