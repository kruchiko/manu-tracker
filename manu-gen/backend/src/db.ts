import Database, { type Database as DatabaseType } from "better-sqlite3";
import path from "node:path";

const DB_PATH = process.env.DB_PATH ?? path.join(process.cwd(), "manu-gen.db");

const db: DatabaseType = new Database(DB_PATH);

db.pragma("journal_mode = WAL");
db.pragma("foreign_keys = ON");

const MIGRATIONS: string[] = [
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
  MIGRATIONS.forEach((sql, index) => {
    if (!applied.has(index)) {
      db.prepare(sql).run();
      insertVersion.run(index);
    }
  });
})();

export default db;
