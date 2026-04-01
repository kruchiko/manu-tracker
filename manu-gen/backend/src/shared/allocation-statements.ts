import type BetterSqlite3 from "better-sqlite3";
import db from "../db.js";

export const stmtInsertAllocation: BetterSqlite3.Statement = db.prepare(`
  INSERT INTO job_allocations (order_line_id, job_id, quantity)
  VALUES (@order_line_id, @job_id, @quantity)
`);
