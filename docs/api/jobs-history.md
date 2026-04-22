# `GET /jobs/:id/history` — audit (GitHub #29)

This endpoint returns chronological **job journey** events derived from `tracking_events` for the job’s tray.

## Response shape

Each entry:

| Field | Type | Notes |
|-------|------|--------|
| `id` | number | Source tracking event id |
| `phase` | `"arrived"` \| `"departed"` \| `"scan"` | Normalized phase for UI |
| `stationId` | string | Station id — stable key for timeline theming / future deep links |
| `station` | string | Human-readable station name |
| `at` | string | ISO 8601 UTC timestamp |
| `durationSeconds` | number \| null | Dwell or segment duration where applicable |

## Design alignment

[v2 DESIGN-SYSTEM](../../design/v2/DESIGN-SYSTEM.md) lists **job-detail** as including a timeline. The above fields are sufficient for the current ManuTracker job detail and dashboard timelines: labels use `phase` + `station`, ordering uses `at`, dwell bars use `durationSeconds`, and `stationId` supports consistent station colouring without relying on display names alone.

If the prototype later requires raw event metadata (e.g. operator id), extend this contract in a backwards-compatible way rather than replacing fields.
