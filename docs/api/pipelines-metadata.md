# `PATCH /pipelines/:id` — metadata updates (GitHub #26)

Updates pipeline **name**, **product type**, and/or **description** without replacing steps.

## Body (JSON)

All fields optional; send only fields to change.

| Field | Type | Validation |
|-------|------|--------------|
| `name` | string | If present, non-empty after trim (`z.string().min(1)`) |
| `productType` | string | If present, non-empty |
| `description` | string | Optional; may be set to `""` to clear |

## Response

`200` — full `Pipeline` object (same shape as `GET /pipelines/:id`), including `steps`.

Step edits remain on `PUT /pipelines/:id/steps`.
