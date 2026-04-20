import Database, { type Database as DatabaseType } from "better-sqlite3";
import path from "node:path";

const DB_PATH = process.env.DB_PATH ?? path.join(process.cwd(), "manu-gen.db");

const db: DatabaseType = new Database(DB_PATH);

db.pragma("journal_mode = WAL");
db.pragma("foreign_keys = ON");

const SCHEMA: string[] = [
  `CREATE TABLE IF NOT EXISTS stations (
    id             TEXT PRIMARY KEY,
    name           TEXT NOT NULL,
    location       TEXT NOT NULL DEFAULT '',
    eye_id         TEXT UNIQUE,
    slot_capacity  INTEGER NOT NULL DEFAULT 1 CHECK (slot_capacity >= 1 AND slot_capacity <= 15)
  )`,

  `CREATE TABLE IF NOT EXISTS tracking_events (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    tray_code   TEXT NOT NULL,
    station_id  TEXT NOT NULL REFERENCES stations(id),
    eye_id      TEXT NOT NULL,
    captured_at TEXT NOT NULL,
    received_at TEXT NOT NULL DEFAULT (datetime('now')),
    phase       TEXT NOT NULL DEFAULT 'scan'
  )`,

  `CREATE TABLE IF NOT EXISTS pipelines (
    id           TEXT PRIMARY KEY,
    name         TEXT NOT NULL,
    description  TEXT NOT NULL DEFAULT '',
    product_type TEXT NOT NULL DEFAULT '',
    created_at   TEXT NOT NULL DEFAULT (datetime('now'))
  )`,

  `CREATE UNIQUE INDEX IF NOT EXISTS idx_pipelines_product_type
   ON pipelines(product_type) WHERE product_type != ''`,

  `CREATE TABLE IF NOT EXISTS pipeline_steps (
    id                   INTEGER PRIMARY KEY AUTOINCREMENT,
    pipeline_id          TEXT NOT NULL REFERENCES pipelines(id),
    station_id           TEXT NOT NULL REFERENCES stations(id),
    position             INTEGER NOT NULL CHECK (position > 0),
    max_duration_seconds INTEGER,
    max_capacity         INTEGER,
    UNIQUE(pipeline_id, position),
    UNIQUE(pipeline_id, station_id)
  )`,

  `CREATE TABLE IF NOT EXISTS jobs (
    id           INTEGER PRIMARY KEY AUTOINCREMENT,
    job_number   TEXT NOT NULL,
    product_type TEXT NOT NULL,
    quantity     INTEGER NOT NULL CHECK (quantity > 0),
    notes        TEXT DEFAULT '',
    tray_code    TEXT NOT NULL UNIQUE,
    created_at   TEXT NOT NULL DEFAULT (datetime('now')),
    pipeline_id  TEXT NOT NULL REFERENCES pipelines(id),
    status       TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','in_progress','completed'))
  )`,

  `CREATE TABLE IF NOT EXISTS customer_orders (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    order_number  TEXT NOT NULL UNIQUE,
    customer_name TEXT NOT NULL,
    notes         TEXT DEFAULT '',
    status        TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open','in_progress','fulfilled','cancelled')),
    due_date      TEXT,
    created_at    TEXT NOT NULL DEFAULT (datetime('now'))
  )`,

  `CREATE TABLE IF NOT EXISTS order_lines (
    id                INTEGER PRIMARY KEY AUTOINCREMENT,
    customer_order_id INTEGER NOT NULL REFERENCES customer_orders(id),
    product_type      TEXT NOT NULL,
    quantity          INTEGER NOT NULL CHECK (quantity > 0),
    UNIQUE(customer_order_id, product_type)
  )`,

  `CREATE TABLE IF NOT EXISTS job_allocations (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    order_line_id INTEGER NOT NULL REFERENCES order_lines(id),
    job_id        INTEGER NOT NULL REFERENCES jobs(id),
    quantity      INTEGER NOT NULL CHECK (quantity > 0),
    UNIQUE(order_line_id, job_id)
  )`,
];

db.transaction(() => {
  for (const sql of SCHEMA) {
    db.prepare(sql).run();
  }
})();

const stationColumnNames = db
  .prepare(`PRAGMA table_info(stations)`)
  .all() as { name: string }[];
if (!stationColumnNames.some((c) => c.name === "slot_capacity")) {
  db.exec(
    `ALTER TABLE stations ADD COLUMN slot_capacity INTEGER NOT NULL DEFAULT 1 CHECK (slot_capacity >= 1 AND slot_capacity <= 15)`,
  );
}

export default db;
