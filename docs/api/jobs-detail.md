# `GET /jobs/:id` and `GET /jobs/tray/:trayCode` (GitHub #28)

Single-job responses extend the list `Job` object with:

## `pipeline`

Same object as `GET /jobs/board` → `BoardJob.pipeline`:

- `id`, `name` — pipeline identity and label
- `stepPosition` — current step index (1-based position in `pipeline_steps` matching the tray’s latest non-departed station, or `0` when not on a step)
- `totalSteps` — count of steps in the pipeline
- `expectedSeconds` — sum of `max_duration_seconds` over steps where set; else `null`
- `elapsedSeconds` — seconds from first tracking event on the tray to now, or `null` if no events

Semantics match the board query so job detail does not need `GET /jobs/board`.

## `allocations` and `availableToAllocate`

See [job-allocations.md](./job-allocations.md).
