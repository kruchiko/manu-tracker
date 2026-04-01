import db from "../db.js";

export const stmtInsertAllocation = db.prepare(`
  INSERT INTO job_allocations (order_line_id, job_id, quantity)
  VALUES (@order_line_id, @job_id, @quantity)
`);
