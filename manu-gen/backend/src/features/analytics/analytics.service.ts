import db from "../../db.js";
import type {
  StationDurationRow,
  StationDuration,
  DashboardSummary,
  HourlyActivityRow,
  StationActivity,
  OrderMetrics,
  ProductTypeMetric,
} from "./analytics.schema.js";
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

function percentile(sorted: number[], p: number): number {
  if (sorted.length === 0) return 0;
  const index = (p / 100) * (sorted.length - 1);
  const lower = Math.floor(index);
  const upper = Math.ceil(index);
  if (lower === upper) return sorted[lower];
  return sorted[lower] + (sorted[upper] - sorted[lower]) * (index - lower);
}

const stmtStationMeta = db.prepare(`SELECT id, name FROM stations`);

interface StationMeta {
  id: string;
  name: string;
}

function buildDurationRows(
  accumByStation: Map<string, StationDurationAccum>,
  metaById: Map<string, StationMeta>,
): StationDurationRow[] {
  const rows: StationDurationRow[] = [];
  for (const [stationId, { seconds, trays }] of accumByStation) {
    if (seconds.length === 0) continue;
    const sorted = [...seconds].sort((a, b) => a - b);
    const sum = sorted.reduce((a, b) => a + b, 0);
    const meta = metaById.get(stationId);
    rows.push({
      station_id: stationId,
      station_name: meta?.name ?? stationId,
      avg_seconds: sum / sorted.length,
      max_seconds: sorted[sorted.length - 1],
      min_seconds: sorted[0],
      median_seconds: percentile(sorted, 50),
      p95_seconds: percentile(sorted, 95),
      job_count: trays.size,
    });
  }
  rows.sort((a, b) => a.station_name.localeCompare(b.station_name));
  return rows;
}

interface PipelineStepThreshold {
  station_id: string;
  max_duration_seconds: number;
}

const stmtPipelineStepThresholds = db.prepare(`
  SELECT station_id, MIN(max_duration_seconds) AS max_duration_seconds
  FROM pipeline_steps
  WHERE max_duration_seconds IS NOT NULL
  GROUP BY station_id
`);

function countThresholdViolations(accumByStation: Map<string, StationDurationAccum>): number {
  const rows = stmtPipelineStepThresholds.all() as PipelineStepThreshold[];
  const thresholdByStation = new Map(rows.map((r) => [r.station_id, r.max_duration_seconds]));
  let count = 0;
  for (const [stationId, { seconds }] of accumByStation) {
    const threshold = thresholdByStation.get(stationId);
    if (threshold == null) continue;
    for (const sec of seconds) {
      if (sec >= threshold) count++;
    }
  }
  return count;
}

export function getStationDurations(): StationDuration[] {
  const accumByStation = collectStationDurationsFromEvents();
  const stations = stmtStationMeta.all() as StationMeta[];
  const metaById = new Map(stations.map((s) => [s.id, s]));
  return buildDurationRows(accumByStation, metaById).map(toStationDuration);
}

const ACTIVE_MINUTES = 30;

const stmtActiveJobs = db.prepare(`
  SELECT COUNT(DISTINCT tray_code) AS cnt
  FROM tracking_events
  WHERE captured_at >= datetime('now', ?)
`);

const stmtTrackedJobs = db.prepare(`
  SELECT COUNT(DISTINCT tray_code) AS cnt
  FROM tracking_events
`);

export function getDashboardSummary(): DashboardSummary {
  const accumByStation = collectStationDurationsFromEvents();
  const stations = stmtStationMeta.all() as StationMeta[];
  const metaById = new Map(stations.map((s) => [s.id, s]));
  const durationRows = buildDurationRows(accumByStation, metaById);
  const durations = durationRows.map(toStationDuration);

  const { cnt: activeJobs } = stmtActiveJobs.get(`-${ACTIVE_MINUTES} minutes`) as { cnt: number };
  const { cnt: totalTrackedJobs } = stmtTrackedJobs.get() as { cnt: number };

  let totalAvg = 0;
  let count = 0;
  let bottleneckStation: string | null = null;
  let bottleneckAvg = 0;

  for (const d of durations) {
    totalAvg += d.avgSeconds;
    count++;
    if (d.avgSeconds > bottleneckAvg) {
      bottleneckAvg = d.avgSeconds;
      bottleneckStation = d.stationName;
    }
  }

  const thresholdViolations = countThresholdViolations(accumByStation);

  return {
    activeJobs,
    totalTrackedJobs,
    avgDwellSeconds: count > 0 ? Math.round(totalAvg / count) : 0,
    bottleneckStation,
    thresholdViolations,
  };
}

function utcIsoHour(date: Date): string {
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}-${String(date.getUTCDate()).padStart(2, "0")}T${String(date.getUTCHours()).padStart(2, "0")}:00:00`;
}

const stmtHourlyActivity = db.prepare(`
  SELECT
    te.station_id,
    s.name AS station_name,
    strftime('%Y-%m-%dT%H:00:00', te.captured_at) AS hour,
    COUNT(*) AS visit_count
  FROM tracking_events te
  JOIN stations s ON s.id = te.station_id
  WHERE te.phase = 'departed'
    AND te.captured_at >= @since
  GROUP BY te.station_id, hour
  ORDER BY te.station_id, hour
`);

export function getHourlyActivity(): StationActivity[] {
  const now = new Date();
  const sinceDate = new Date(now.getTime() - 24 * 3600_000);
  const sinceIso = sinceDate.toISOString().replace("Z", "");

  const rows = stmtHourlyActivity.all({ since: sinceIso }) as HourlyActivityRow[];

  const byStation = new Map<string, { name: string; buckets: Map<string, number> }>();
  for (const r of rows) {
    let entry = byStation.get(r.station_id);
    if (!entry) {
      entry = { name: r.station_name, buckets: new Map() };
      byStation.set(r.station_id, entry);
    }
    entry.buckets.set(r.hour, r.visit_count);
  }

  const hours: string[] = [];
  for (let i = 23; i >= 0; i--) {
    hours.push(utcIsoHour(new Date(now.getTime() - i * 3600_000)));
  }

  const result: StationActivity[] = [];
  for (const [stationId, { name, buckets }] of byStation) {
    result.push({
      stationId,
      stationName: name,
      buckets: hours.map((h) => ({ hour: h, count: buckets.get(h) ?? 0 })),
    });
  }

  return result;
}

const stmtOrderCounts = db.prepare(`
  SELECT
    COUNT(*) AS total,
    SUM(CASE WHEN status = 'fulfilled' THEN 1 ELSE 0 END) AS fulfilled
  FROM customer_orders
`);

const stmtAvgJobsPerOrder = db.prepare(`
  SELECT AVG(job_cnt) AS avg_jobs FROM (
    SELECT co.id, COUNT(DISTINCT ja.job_id) AS job_cnt
    FROM customer_orders co
    JOIN order_lines ol ON ol.customer_order_id = co.id
    JOIN job_allocations ja ON ja.order_line_id = ol.id
    GROUP BY co.id
  )
`);

const stmtProductTypeMetrics = db.prepare(`
  SELECT
    ol.product_type,
    SUM(ol.quantity) AS total_quantity,
    SUM(COALESCE((
      SELECT SUM(ja2.quantity) FROM job_allocations ja2
      JOIN jobs j2 ON j2.id = ja2.job_id
      WHERE ja2.order_line_id = ol.id AND j2.status = 'completed'
    ), 0)) AS fulfilled_quantity,
    COUNT(DISTINCT ja.job_id) AS job_count
  FROM order_lines ol
  LEFT JOIN job_allocations ja ON ja.order_line_id = ol.id
  GROUP BY ol.product_type
  ORDER BY total_quantity DESC
`);

interface OrderCountRow {
  total: number;
  fulfilled: number;
}

interface ProductTypeMetricRow {
  product_type: string;
  total_quantity: number;
  fulfilled_quantity: number;
  job_count: number;
}

export function getOrderMetrics(): OrderMetrics {
  const counts = stmtOrderCounts.get() as OrderCountRow;
  const avgJobs = stmtAvgJobsPerOrder.get() as { avg_jobs: number | null };
  const productRows = stmtProductTypeMetrics.all() as ProductTypeMetricRow[];

  const byProductType: ProductTypeMetric[] = productRows.map((r) => ({
    productType: r.product_type,
    totalQuantity: r.total_quantity,
    fulfilledQuantity: r.fulfilled_quantity,
    jobCount: r.job_count,
  }));

  return {
    totalOrders: counts.total,
    fulfilledOrders: counts.fulfilled,
    avgJobsPerOrder: avgJobs.avg_jobs !== null ? Math.round(avgJobs.avg_jobs * 10) / 10 : 0,
    byProductType,
  };
}
