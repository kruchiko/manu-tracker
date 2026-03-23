import db from "../../db.js";
import { AppError } from "../../shared/errors/app-error.js";
import type { CreateEventInput, TrackingEvent, TrackingEventRow } from "./events.schema.js";
import { toTrackingEvent } from "./events.schema.js";

const EVENT_COLUMNS = "id, tray_code, station_id, eye_id, captured_at, received_at, phase";

const stmtInsert = db.prepare(
  `INSERT INTO tracking_events (tray_code, station_id, eye_id, captured_at, phase)
   VALUES (@tray_code, @station_id, @eye_id, @captured_at, @phase)`,
);

const stmtGetById = db.prepare(`SELECT ${EVENT_COLUMNS} FROM tracking_events WHERE id = ?`);

const stmtList = db.prepare(
  `SELECT ${EVENT_COLUMNS} FROM tracking_events ORDER BY id DESC LIMIT ? OFFSET ?`,
);

export function createEvent(input: CreateEventInput): TrackingEvent {
  const result = stmtInsert.run({
    tray_code: input.trayCode,
    station_id: input.stationId,
    eye_id: input.eyeId,
    captured_at: input.capturedAt,
    phase: input.phase ?? "scan",
  });
  return getEventById(Number(result.lastInsertRowid));
}

export function getEventById(id: number): TrackingEvent {
  const row = stmtGetById.get(id) as TrackingEventRow | undefined;
  if (!row) {
    throw new AppError(404, `Event with id ${id} not found`);
  }
  return toTrackingEvent(row);
}

export function listEvents({ limit = 50, offset = 0 }: { limit?: number; offset?: number } = {}): TrackingEvent[] {
  const rows = stmtList.all(limit, offset) as TrackingEventRow[];
  return rows.map(toTrackingEvent);
}
