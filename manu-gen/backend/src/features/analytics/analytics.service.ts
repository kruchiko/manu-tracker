import db from "../../db.js";
import type { StationDurationRow, StationDuration } from "./analytics.schema.js";
import { toStationDuration } from "./analytics.schema.js";
import { parseUtcMs } from "../../shared/datetime.js";

interface TrackingEventDurationRow {
  tray_code: string;
  station_id: string;
  captured_at: string;
  phase: string;
  id: number;
}

const stmtAllEventsForDurations = db.prepare(`
  SELECT tray_code, station_id, captured_at, phase, id
  FROM tracking_events
  ORDER BY tray_code, captured_at, id
`);

interface StationDurationAccum {
  seconds: number[];
  trays: Set<string>;
}

function ensureAccum(map: Map<string, StationDurationAccum>, stationId: string): StationDurationAccum {
  let a = map.get(stationId);
  if (!a) {
    a = { seconds: [], trays: new Set() };
    map.set(stationId, a);
  }
  return a;
}

function pushSample(
  map: Map<string, StationDurationAccum>,
  stationId: string,
  trayCode: string,
  seconds: number,
): void {
  if (seconds < 0) return;
  const a = ensureAccum(map, stationId);
  a.seconds.push(seconds);
  a.trays.add(trayCode);
}

/** Collect per-visit dwell seconds and distinct trays per station. */
function collectStationDurationsFromEvents(): Map<string, StationDurationAccum> {
  const rows = stmtAllEventsForDurations.all() as TrackingEventDurationRow[];
  const byTray = new Map<string, TrackingEventDurationRow[]>();
  for (const r of rows) {
    const list = byTray.get(r.tray_code);
    if (list) {
      list.push(r);
    } else {
      byTray.set(r.tray_code, [r]);
    }
  }

  const result = new Map<string, StationDurationAccum>();

  for (const [trayCode, trayRows] of byTray) {
    trayRows.sort(
      (a, b) => parseUtcMs(a.captured_at) - parseUtcMs(b.captured_at) || a.id - b.id,
    );
    const pendingArrivedMs = new Map<string, number>();

    for (let i = 0; i < trayRows.length; i++) {
      const r = trayRows[i];
      const ms = parseUtcMs(r.captured_at);

      if (r.phase === "scan") {
        const next = trayRows[i + 1];
        if (next) {
          const sec = Math.floor((parseUtcMs(next.captured_at) - ms) / 1000);
          pushSample(result, r.station_id, trayCode, sec);
        }
        continue;
      }

      if (r.phase === "arrived") {
        pendingArrivedMs.set(r.station_id, ms);
        continue;
      }

      if (r.phase === "departed") {
        const startMs = pendingArrivedMs.get(r.station_id);
        if (startMs !== undefined) {
          pushSample(result, r.station_id, trayCode, Math.floor((ms - startMs) / 1000));
          pendingArrivedMs.delete(r.station_id);
        }
      }
    }
  }

  return result;
}

const stmtStationMeta = db.prepare(`SELECT id, name FROM stations`);

export function getStationDurations(): StationDuration[] {
  const accumByStation = collectStationDurationsFromEvents();
  const stations = stmtStationMeta.all() as { id: string; name: string }[];
  const nameById = new Map(stations.map((s) => [s.id, s.name]));

  const rows: StationDurationRow[] = [];
  for (const [stationId, { seconds, trays }] of accumByStation) {
    if (seconds.length === 0) continue;
    const sum = seconds.reduce((a, b) => a + b, 0);
    rows.push({
      station_id: stationId,
      station_name: nameById.get(stationId) ?? stationId,
      avg_seconds: sum / seconds.length,
      max_seconds: Math.max(...seconds),
      order_count: trays.size,
    });
  }

  rows.sort((a, b) => a.station_name.localeCompare(b.station_name));
  return rows.map(toStationDuration);
}
