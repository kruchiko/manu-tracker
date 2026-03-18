import db from "../../db.js";
import type { StationDurationRow, StationDuration } from "./analytics.schema.js";
import { toStationDuration } from "./analytics.schema.js";

const stmtDurations = db.prepare(`
  SELECT
    s.id   AS station_id,
    s.name AS station_name,
    AVG(duration_seconds) AS avg_seconds,
    MAX(duration_seconds) AS max_seconds,
    COUNT(DISTINCT te.tray_code) AS order_count
  FROM (
    SELECT
      te.tray_code,
      te.station_id,
      (julianday(LEAD(te.captured_at) OVER (
        PARTITION BY te.tray_code ORDER BY te.captured_at
      )) - julianday(te.captured_at)) * 86400 AS duration_seconds
    FROM tracking_events te
  ) te
  JOIN stations s ON s.id = te.station_id
  WHERE te.duration_seconds IS NOT NULL
  GROUP BY s.id, s.name
  ORDER BY s.name
`);

export function getStationDurations(): StationDuration[] {
  const rows = stmtDurations.all() as StationDurationRow[];
  return rows.map(toStationDuration);
}
