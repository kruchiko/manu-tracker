import Database from "better-sqlite3";
import path from "node:path";

const DB_PATH = process.env.DB_PATH ?? path.join(process.cwd(), "manu-gen.db");

const db = new Database(DB_PATH);

db.pragma("journal_mode = WAL");
db.pragma("foreign_keys = ON");

db.exec(`
  CREATE TABLE IF NOT EXISTS orders (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    order_number  TEXT NOT NULL,
    customer_name TEXT NOT NULL,
    product_type  TEXT NOT NULL,
    quantity      INTEGER NOT NULL CHECK (quantity > 0),
    notes         TEXT DEFAULT '',
    tray_code     TEXT NOT NULL UNIQUE,
    created_at    TEXT NOT NULL DEFAULT (datetime('now'))
  )
`);

export default db;
