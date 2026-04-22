# Job ↔ order line allocations (GitHub #35)

Allocations link a **job** to an **order line** (`job_allocations.job_id`, `order_line_id`).

## Endpoints

- `POST /jobs/:jobId/allocations` — body `{ orderLineId, quantity }`. Returns the created allocation (includes `customerOrderId` for deep links).
- `GET /jobs/:jobId/allocations` — list allocations for the job.
- `DELETE /jobs/:jobId/allocations/:allocationId` — remove one allocation.

## Constraints (server-enforced)

1. **Order line exists** — unknown `orderLineId` → `404`.
2. **Product type match** — order line `productType` must equal the job’s `productType` → `422` with explicit message.
3. **Capacity** — `quantity` must not exceed **unallocated** job quantity: `job.quantity - sum(existing allocations for this job)` → `422` with message naming `jobNumber`, `quantity`, and `allocatedQuantity`.
4. **Uniqueness** — at most one allocation per `(job_id, order_line_id)` → `409` on duplicate.

## Job detail payload (`GET /jobs/:id`)

Includes:

- `allocations[]` — same rows as `GET /jobs/:id/allocations`, each with `customerOrderId`, `orderNumber`, `customerName`, `quantity`, etc.
- `availableToAllocate` — `quantity - allocatedQuantity` after all allocations (non-negative).

Clients should use these fields for manual allocation UX instead of inferring capacity from `quantity` alone.
