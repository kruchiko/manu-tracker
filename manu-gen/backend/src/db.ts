import Database, { type Database as DatabaseType } from "better-sqlite3";
import path from "node:path";

const DB_PATH = process.env.DB_PATH ?? path.join(process.cwd(), "manu-gen.db");

const db: DatabaseType = new Database(DB_PATH);

db.pragma("journal_mode = WAL");
db.pragma("foreign_keys = ON");

const MIGRATIONS: (string | string[])[] = [
  `CREATE TABLE orders (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    order_number  TEXT NOT NULL,
    customer_name TEXT NOT NULL,
    product_type  TEXT NOT NULL,
    quantity      INTEGER NOT NULL CHECK (quantity > 0),
    notes         TEXT DEFAULT '',
    tray_code     TEXT NOT NULL UNIQUE,
    created_at    TEXT NOT NULL DEFAULT (datetime('now'))
  )`,
  `CREATE TABLE stations (
    id       TEXT PRIMARY KEY,
    name     TEXT NOT NULL,
    location TEXT NOT NULL DEFAULT '',
    eye_id   TEXT UNIQUE
  )`,
  `CREATE TABLE tracking_events (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    tray_code   TEXT NOT NULL,
    station_id  TEXT NOT NULL REFERENCES stations(id),
    eye_id      TEXT NOT NULL,
    captured_at TEXT NOT NULL,
    received_at TEXT NOT NULL DEFAULT (datetime('now'))
  )`,
  `ALTER TABLE tracking_events ADD COLUMN phase TEXT NOT NULL DEFAULT 'scan'`,
  `ALTER TABLE stations ADD COLUMN max_duration_seconds INTEGER`,
  `CREATE TABLE pipelines (
    id          TEXT PRIMARY KEY,
    name        TEXT NOT NULL,
    description TEXT NOT NULL DEFAULT '',
    created_at  TEXT NOT NULL DEFAULT (datetime('now'))
  )`,
  `CREATE TABLE pipeline_steps (
    id                   INTEGER PRIMARY KEY AUTOINCREMENT,
    pipeline_id          TEXT NOT NULL REFERENCES pipelines(id),
    station_id           TEXT NOT NULL REFERENCES stations(id),
    position             INTEGER NOT NULL CHECK (position > 0),
    max_duration_seconds INTEGER,
    UNIQUE(pipeline_id, position),
    UNIQUE(pipeline_id, station_id)
  )`,
  `ALTER TABLE orders ADD COLUMN pipeline_id TEXT REFERENCES pipelines(id)`,
  `ALTER TABLE stations DROP COLUMN max_duration_seconds`,
  [
    `CREATE TABLE orders_new (
       id            INTEGER PRIMARY KEY AUTOINCREMENT,
       order_number  TEXT NOT NULL,
       customer_name TEXT NOT NULL,
       product_type  TEXT NOT NULL,
       quantity      INTEGER NOT NULL CHECK (quantity > 0),
       notes         TEXT DEFAULT '',
       tray_code     TEXT NOT NULL UNIQUE,
       created_at    TEXT NOT NULL DEFAULT (datetime('now')),
       pipeline_id   TEXT NOT NULL REFERENCES pipelines(id)
     )`,
    `INSERT INTO orders_new SELECT id, order_number, customer_name, product_type, quantity, notes, tray_code, created_at, pipeline_id FROM orders WHERE pipeline_id IS NOT NULL`,
    `DROP TABLE orders`,
    `ALTER TABLE orders_new RENAME TO orders`,
  ],
];

db.prepare(
  "CREATE TABLE IF NOT EXISTS schema_migrations (version INTEGER PRIMARY KEY)",
).run();

const applied = new Set(
  (db.prepare("SELECT version FROM schema_migrations").all() as { version: number }[]).map(
    (r) => r.version,
  ),
);

const insertVersion = db.prepare("INSERT INTO schema_migrations (version) VALUES (?)");

db.transaction(() => {
  MIGRATIONS.forEach((entry, index) => {
    if (!applied.has(index)) {
      const statements = Array.isArray(entry) ? entry : [entry];
      for (const sql of statements) {
        db.prepare(sql).run();
      }
      insertVersion.run(index);
    }
  });
})();

export default db;
