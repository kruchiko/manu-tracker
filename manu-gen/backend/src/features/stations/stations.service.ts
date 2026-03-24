import crypto from "node:crypto";
import db from "../../db.js";
import { AppError } from "../../shared/errors/app-error.js";
import type { CreateStationInput, AssignEyeInput, UpdateStationInput, Station, StationRow } from "./stations.schema.js";
import { toStation } from "./stations.schema.js";

const STATION_COLUMNS = "id, name, location, eye_id, max_duration_seconds";

const stmtInsert = db.prepare(
  `INSERT INTO stations (id, name, location) VALUES (@id, @name, @location)`,
);

const stmtGetById = db.prepare(`SELECT ${STATION_COLUMNS} FROM stations WHERE id = ?`);

const stmtGetByEyeId = db.prepare(`SELECT ${STATION_COLUMNS} FROM stations WHERE eye_id = ?`);

const stmtList = db.prepare(
  `SELECT ${STATION_COLUMNS} FROM stations ORDER BY name LIMIT ? OFFSET ?`,
);

const stmtClearEye = db.prepare(`UPDATE stations SET eye_id = NULL WHERE eye_id = ?`);

const stmtClearEyeById = db.prepare(`UPDATE stations SET eye_id = NULL WHERE id = ?`);

const stmtAssignEye = db.prepare(`UPDATE stations SET eye_id = @eye_id WHERE id = @id`);

const stmtUpdateMaxDuration = db.prepare(
  `UPDATE stations SET max_duration_seconds = @max_duration_seconds WHERE id = @id`,
);

const stmtDeleteStation = db.prepare(`DELETE FROM stations WHERE id = ?`);

function generateId(): string {
  return `station-${crypto.randomUUID().slice(0, 8)}`;
}

export function createStation(input: CreateStationInput): Station {
  const id = generateId();
  stmtInsert.run({ id, name: input.name, location: input.location ?? "" });
  return getStationById(id);
}

export function getStationById(id: string): Station {
  const row = stmtGetById.get(id) as StationRow | undefined;
  if (!row) {
    throw new AppError(404, `Station with id ${id} not found`);
  }
  return toStation(row);
}

export function getStationByEyeId(eyeId: string): Station | null {
  const row = stmtGetByEyeId.get(eyeId) as StationRow | undefined;
  return row ? toStation(row) : null;
}

export function listStations({ limit = 50, offset = 0 }: { limit?: number; offset?: number } = {}): Station[] {
  const rows = stmtList.all(limit, offset) as StationRow[];
  return rows.map(toStation);
}

export function updateStation(stationId: string, input: UpdateStationInput): Station {
  const row = stmtGetById.get(stationId) as StationRow | undefined;
  if (!row) {
    throw new AppError(404, `Station with id ${stationId} not found`);
  }
  stmtUpdateMaxDuration.run({ id: stationId, max_duration_seconds: input.maxDurationSeconds });
  return getStationById(stationId);
}

const assignEyeTx = db.transaction((stationId: string, input: AssignEyeInput): void => {
  const row = stmtGetById.get(stationId) as StationRow | undefined;
  if (!row) {
    throw new AppError(404, `Station with id ${stationId} not found`);
  }
  stmtClearEye.run(input.eyeId);
  stmtAssignEye.run({ id: stationId, eye_id: input.eyeId });
});

export function assignEye(stationId: string, input: AssignEyeInput): Station {
  assignEyeTx(stationId, input);
  return getStationById(stationId);
}

export function unassignEye(stationId: string): Station {
  const station = getStationById(stationId);
  if (station.eyeId === null) {
    throw new AppError(400, `Station ${stationId} has no eye assigned`);
  }
  stmtClearEyeById.run(stationId);
  return getStationById(stationId);
}

const stmtDeleteEventsByStation = db.prepare(
  `DELETE FROM tracking_events WHERE station_id = ?`,
);

const deleteStationTx = db.transaction((stationId: string): void => {
  const row = stmtGetById.get(stationId) as StationRow | undefined;
  if (!row) {
    throw new AppError(404, `Station with id ${stationId} not found`);
  }
  stmtClearEyeById.run(stationId);
  stmtDeleteEventsByStation.run(stationId);
  stmtDeleteStation.run(stationId);
});

export function deleteStation(stationId: string): void {
  deleteStationTx(stationId);
}
