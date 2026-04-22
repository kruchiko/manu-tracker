# `PATCH /pipelines/:id` — metadata updates (GitHub #26)

Updates pipeline **name**, **product type**, and/or **description** without replacing steps.

## Body (JSON)

All fields optional; send only fields to change.

| Field | Type | Validation |
|-------|------|--------------|
| `name` | string | If present, non-empty after trim (`z.string().min(1)`) |
| `productType` | string | If present, non-empty |
| `description` | string | Optional; may be set to `""` to clear |

Changing **`productType`** is rejected with **`422`** when any job still references the pipeline.

## Response

`200` — full `Pipeline` object (same shape as `GET /pipelines/:id`), including `steps`.

Step-only edits can use `PUT /pipelines/:id/steps`. The pipeline **edit** screen uses `PUT /pipelines/:id` (below) so metadata and steps save in one transaction.

---

# `PUT /pipelines/:id` — replace metadata and steps (atomic)

Replaces **name**, **description**, **productType**, and the full **steps** list in a **single database transaction**. Prefer this when saving an edited pipeline so metadata and steps cannot diverge if one request fails.

## Body (JSON)

| Field | Type | Validation |
|-------|------|------------|
| `name` | string | Required, non-empty |
| `productType` | string | Required, non-empty |
| `description` | string | Optional; defaults to `""` |
| `steps` | array | Same shape as `POST /pipelines` / `PUT /pipelines/:id/steps` (at least one step) |

Changing **`productType`** is rejected with **`422`** when any job still references the pipeline.

## Response

`200` — full `Pipeline` object (same shape as `GET /pipelines/:id`).
