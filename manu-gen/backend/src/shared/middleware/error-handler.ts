import type { ErrorRequestHandler } from "express";
import Database from "better-sqlite3";
import { AppError } from "../errors/app-error.js";
import { logger } from "../logger.js";

const FK_MESSAGES: Record<string, string> = {
  SQLITE_CONSTRAINT_FOREIGNKEY: "Referenced resource does not exist",
};

export const errorHandler: ErrorRequestHandler = (err, req, res, _next) => {
  if (err instanceof AppError) {
    res.status(err.statusCode).json({ error: err.message });
    return;
  }

  if (err instanceof Database.SqliteError && err.code in FK_MESSAGES) {
    res.status(400).json({ error: FK_MESSAGES[err.code] });
    return;
  }

  logger.error("Unhandled error", {
    method: req.method,
    path: req.path,
    error: err instanceof Error ? err.message : String(err),
    stack: err instanceof Error ? err.stack : undefined,
  });
  res.status(500).json({ error: "Internal server error" });
};
