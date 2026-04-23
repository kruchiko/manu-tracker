# Sub-plan 3: Postgres Migration

> **Parent plan:** [Production Architecture Plan](production_architecture_plan_87189a29.plan.md)
> **Stage:** 3 (parallel with Sub-plan 4)
> **Can start:** After Sub-plan 1a (Repo Organization) and Sub-plan 1b (Frontend Polish)
> **Blocks:** Sub-plan 5 (Deploy)
> **Parallel with:** Sub-plan 4 (Production Infra)

## Objective

Migrate the manu-gen backend from SQLite (better-sqlite3) to Postgres. Introduce a proper migration framework. Decouple the `onTrackingEvent()` cross-domain import with a Postgres trigger. Update local Docker Compose to include Postgres. All tests must pass.

## Working Directory

After repo split (Sub-plan 1a), work happens in the `agrus-ops/manu-gen` repo at `backend/`.

## Current State

- Database: SQLite via `better-sqlite3` in [`src/db.ts`](../../manu-gen/backend/src/db.ts) (repo path: `manu-gen/backend/src/db.ts`)
- Schema: 8 tables defined as `CREATE TABLE IF NOT EXISTS` in `db.ts`, plus additive `ALTER TABLE` blocks
- Queries: Hand-written SQL in `*.service.ts` files using `db.prepare()` + `db.transaction()`
- Tests: Vitest, using `DB_PATH: ":memory:"` for SQLite in CI
- Cross-domain coupling: [`events.service.ts`](../../manu-gen/backend/src/features/events/events.service.ts) imports `onTrackingEvent` from `jobs.service.ts`

## Tasks

### 1. Add migration framework

Create a `migrations/` directory with numbered SQL files and a lightweight runner:

```
backend/
  migrations/
    001_initial_schema.sql     # Full schema (ported to Postgres DDL)
    002_event_job_trigger.sql  # Postgres trigger replacing onTrackingEvent()
  src/
    db.ts                      # Rewritten: Postgres connection pool + migration runner
```

**Migration runner requirements:**
- On startup, connect to Postgres via `DATABASE_URL` env var
- Create a `_migrations` table if not exists: `(id SERIAL PRIMARY KEY, name TEXT NOT NULL UNIQUE, applied_at TIMESTAMPTZ DEFAULT NOW())`
- Read all `.sql` files from `migrations/` sorted by numeric prefix
- Run unapplied migrations in a transaction
- Log each migration applied

**Driver choice:** Use `postgres` (porsager/postgres, aka "postgres.js") -- it's lightweight, has no native dependencies (unlike `pg`), and supports tagged template literals for safe queries. Install via `yarn add postgres`.

### 2. Port schema to Postgres DDL

Create `migrations/001_initial_schema.sql` with the full schema. Key syntax changes from the current SQLite schema in `db.ts`:

| SQLite | Postgres |
|--------|----------|
| `INTEGER PRIMARY KEY AUTOINCREMENT` | `INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY` |
| `TEXT NOT NULL DEFAULT (datetime('now'))` | `TIMESTAMPTZ NOT NULL DEFAULT NOW()` |
| `TEXT` for date columns (`captured_at`, `received_at`, `created_at`, `due_date`) | `TIMESTAMPTZ` (or `TEXT` if you want to preserve string format -- recommend `TIMESTAMPTZ`) |
| `INSERT OR IGNORE` | `INSERT ... ON CONFLICT DO NOTHING` |
| Partial unique index syntax is the same | Same |

**Tables to port (all from `db.ts`):**
- `stations` (TEXT PK)
- `tracking_events` (auto-increment PK, FK to stations)
- `pipelines` (TEXT PK) + partial unique index on `product_type`
- `pipeline_steps` (auto-increment PK, FKs to pipelines + stations)
- `jobs` (auto-increment PK, FK to pipelines)
- `customer_orders` (auto-increment PK)
- `order_lines` (auto-increment PK, FK to customer_orders)
- `job_allocations` (auto-increment PK, FKs to order_lines + jobs)

### 3. Swap driver and rewrite `db.ts`

Replace `better-sqlite3` with `postgres`:

**Before (current `db.ts`):**
```typescript
import Database from "better-sqlite3";
const db = new Database(DB_PATH);
db.pragma("journal_mode = WAL");
// ... schema creation ...
export default db;
```

**After:**
```typescript
import postgres from "postgres";

const sql = postgres(process.env.DATABASE_URL ?? "postgres://manugen:local@localhost:5432/manugen");

// Run migrations on startup
await runMigrations(sql);

export default sql;
```

**Important:** `postgres.js` uses tagged template literals (`sql\`SELECT ...\``) instead of `db.prepare().run()`. Every service file needs updating.

### 4. Update all service files

Every `*.service.ts` that uses `db.prepare()` must be rewritten to use `postgres.js` tagged templates. Files to update:

- `src/features/stations/stations.service.ts`
- `src/features/events/events.service.ts`
- `src/features/jobs/jobs.service.ts`
- `src/features/pipelines/pipelines.service.ts`
- `src/features/customer-orders/customer-orders.service.ts`
- `src/features/analytics/analytics.service.ts`
- `src/features/eyes/eyes.service.ts`
- `src/shared/allocation-statements.ts`

**Pattern change:**

```typescript
// Before (better-sqlite3):
const stmt = db.prepare(`SELECT * FROM stations WHERE id = ?`);
const row = stmt.get(id);

// After (postgres.js):
const [row] = await sql`SELECT * FROM stations WHERE id = ${id}`;
```

**Key differences:**
- All queries become `async` (postgres.js is async, better-sqlite3 was sync)
- All service functions that call the DB must become `async` and return `Promise<T>`
- All controller handlers that call services must `await` the results
- Transactions: `sql.begin(async (tx) => { ... })` instead of `db.transaction(() => { ... })()`
- No prepared statement variables -- use tagged template interpolation (safe from SQL injection)
- `result.lastInsertRowid` -> use `RETURNING id` clause in INSERT statements

### 5. Create Postgres trigger for `onTrackingEvent`

Create `migrations/002_event_job_trigger.sql`:

This replaces the direct import of `onTrackingEvent()` from `jobs.service.ts` into `events.service.ts`. The trigger fires `AFTER INSERT ON tracking_events` and performs the same logic:

1. Look up the job by `tray_code`
2. If job is `pending`, update to `in_progress`
3. If job is `in_progress`, count distinct stations with `phase = 'departed'`; if count >= pipeline step count, update to `completed`

**After creating the trigger:**
- Remove the `import { onTrackingEvent } from "../jobs/jobs.service.js"` line from `events.service.ts`
- Remove the `onTrackingEvent(input.trayCode)` call from `createEvent()`
- Remove the `onTrackingEvent` export from `jobs.service.ts` (keep the logic as reference for the trigger)

### 6. Update `docker-compose.yml` for local dev

Add a Postgres container to the root `docker-compose.yml`:

```yaml
services:
  db:
    image: postgres:17-alpine
    restart: unless-stopped
    environment:
      POSTGRES_DB: manugen
      POSTGRES_USER: manugen
      POSTGRES_PASSWORD: local
    ports:
      - "5432:5432"
    volumes:
      - pgdata:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U manugen"]
      interval: 5s
      timeout: 3s
      retries: 5

  backend:
    # ... existing config ...
    environment:
      DATABASE_URL: postgres://manugen:local@db:5432/manugen
      # Remove DB_PATH
    depends_on:
      db:
        condition: service_healthy

volumes:
  pgdata:
  # Remove backend-data (was for SQLite file)
```

### 7. Update tests

- Tests currently use `DB_PATH: ":memory:"` for SQLite
- For Postgres tests, use a test database (e.g., `manugen_test`)
- Option A: Spin up a Postgres container in CI (GitHub Actions service container)
- Option B: Use `pglite` (embedded Postgres for testing) -- lighter but less realistic
- Recommended: **Option A** (service container in CI) for realistic testing
- Each test file should truncate tables in setup (the existing pattern of `DELETE FROM` in dependency order still works)

Update `.github/workflows/ci-manu-gen-backend.yml` to add a Postgres service:

```yaml
services:
  postgres:
    image: postgres:17
    env:
      POSTGRES_DB: manugen_test
      POSTGRES_USER: manugen
      POSTGRES_PASSWORD: test
    ports:
      - 5432:5432
    options: >-
      --health-cmd pg_isready
      --health-interval 5s
      --health-timeout 3s
      --health-retries 5
```

### 8. Clean up

- Remove `better-sqlite3` from `package.json` (`yarn remove better-sqlite3 @types/better-sqlite3`)
- Remove `scripts/clean-docker-db.sh` (or update for Postgres)
- Remove `db:clean` script from `package.json` (or update)
- Update `README.md` with new setup instructions

## Validation Criteria

- [ ] `docker compose up` starts Postgres + backend + frontend successfully
- [ ] All existing tests pass against Postgres
- [ ] `POST /events` creates events AND triggers job status transitions via Postgres trigger (not application code)
- [ ] `events.service.ts` has zero imports from `jobs.service.ts`
- [ ] Seed script (`scripts/seed-demo.mjs`) runs successfully against Postgres
- [ ] No `better-sqlite3` references remain in the codebase
