import QRCode from "qrcode";
import db from "../../db.js";
import { AppError } from "../../shared/errors/app-error.js";
import { parseUtcMs, toIso } from "../../shared/datetime.js";
import { getPipelineById } from "../pipelines/pipelines.service.js";
import type {
  CreateJobInput,
  CreateAllocationInput,
  Job,
  JobRow,
  BoardJobRow,
  BoardJob,
  JobHistoryEntry,
  JobHistoryPhase,
  AllocationRow,
  Allocation,
} from "./jobs.schema.js";
import { toJob, toBoardJob, toAllocation } from "./jobs.schema.js";
import { stmtInsertAllocation } from "../../shared/allocation-statements.js";

const QR_OPTIONS = {
  width: 300,
  margin: 2,
  errorCorrectionLevel: "H",
} as const;

const JOB_COLUMNS = `o.id, o.job_number, o.product_type, o.quantity, o.notes, o.tray_code, o.created_at, o.pipeline_id, o.status, p.name AS pipeline_name,
  COALESCE((SELECT SUM(ja.quantity) FROM job_allocations ja WHERE ja.job_id = o.id), 0) AS allocated_quantity`;

function formatJobNumber(id: number): string {
  return `JOB-${String(id).padStart(4, "0")}`;
}

function formatTrayCode(id: number): string {
  return `TRAY-${String(id).padStart(4, "0")}`;
}

const stmtNextId = db.prepare("SELECT COALESCE(MAX(id), 0) + 1 AS next_id FROM jobs");

const stmtInsert = db.prepare(`
  INSERT INTO jobs (id, job_number, product_type, quantity, notes, tray_code, pipeline_id)
  VALUES (@id, @job_number, @product_type, @quantity, @notes, @tray_code, @pipeline_id)
`);

const stmtGetById = db.prepare(
  `SELECT ${JOB_COLUMNS} FROM jobs o JOIN pipelines p ON p.id = o.pipeline_id WHERE o.id = ?`,
);

const stmtGetByTrayCode = db.prepare(
  `SELECT ${JOB_COLUMNS} FROM jobs o JOIN pipelines p ON p.id = o.pipeline_id WHERE o.tray_code = ?`,
);

const stmtListJobs = db.prepare(
  `SELECT ${JOB_COLUMNS} FROM jobs o JOIN pipelines p ON p.id = o.pipeline_id ORDER BY o.id DESC LIMIT ? OFFSET ?`,
);

const createJobTx = db.transaction((input: CreateJobInput): number => {
  const { next_id: nextId } = stmtNextId.get() as { next_id: number };

  stmtInsert.run({
    id: nextId,
    job_number: formatJobNumber(nextId),
    product_type: input.productType,
    quantity: input.quantity,
    notes: input.notes ?? "",
    tray_code: formatTrayCode(nextId),
    pipeline_id: input.pipelineId,
  });

  return nextId;
});

export function createJob(input: CreateJobInput): Job {
  const pipeline = getPipelineById(input.pipelineId);
  if (pipeline.productType && pipeline.productType !== input.productType) {
    throw new AppError(
      422,
      `Product type "${input.productType}" does not match pipeline product type "${pipeline.productType}"`,
    );
  }
  if (pipeline.effectiveCapacity !== null && input.quantity > pipeline.effectiveCapacity) {
    throw new AppError(
      422,
      `Quantity ${input.quantity} exceeds pipeline capacity of ${pipeline.effectiveCapacity}`,
    );
  }
  const id = createJobTx(input);
  return getJobById(id);
}

export function getJobById(id: number): Job {
  const row = stmtGetById.get(id) as JobRow | undefined;
  if (!row) {
    throw new AppError(404, `Job with id ${id} not found`);
  }
  return toJob(row);
}

export function getJobByTrayCode(trayCode: string): Job {
  const row = stmtGetByTrayCode.get(trayCode) as JobRow | undefined;
  if (!row) {
    throw new AppError(404, `Job with tray code ${trayCode} not found`);
  }
  return toJob(row);
}

export function listJobs({ limit = 50, offset = 0 }: { limit?: number; offset?: number } = {}): Job[] {
  const rows = stmtListJobs.all(limit, offset) as JobRow[];
  return rows.map(toJob);
}

const stmtDeleteAllocsByJob = db.prepare("DELETE FROM job_allocations WHERE job_id = ?");
const stmtTrayCodeById = db.prepare("SELECT tray_code FROM jobs WHERE id = ?");
const stmtDeleteEventsByTray = db.prepare("DELETE FROM tracking_events WHERE tray_code = ?");
const stmtDeleteJob = db.prepare("DELETE FROM jobs WHERE id = ?");

const deleteJobTx = db.transaction((id: number) => {
  const row = stmtTrayCodeById.get(id) as { tray_code: string } | undefined;
  if (!row) {
    throw new AppError(404, `Job with id ${id} not found`);
  }
  stmtDeleteAllocsByJob.run(id);
  stmtDeleteEventsByTray.run(row.tray_code);
  stmtDeleteJob.run(id);
});

export function deleteJob(id: number): void {
  deleteJobTx(id);
}

const stmtJobBoard = db.prepare(`
  SELECT
    o.id,
    o.job_number,
    o.product_type,
    o.tray_code,
    o.created_at,
    o.status,
    CASE WHEN ranked.phase = 'departed' THEN NULL ELSE ranked.station_id END AS station_id,
    CASE WHEN ranked.phase = 'departed' THEN NULL ELSE s.name END AS station_name,
    ranked.captured_at AS last_seen_at,
    CASE WHEN ranked.phase = 'departed' THEN NULL ELSE (
      SELECT te2.captured_at FROM tracking_events te2
      WHERE te2.tray_code = o.tray_code
        AND te2.station_id = ranked.station_id
        AND te2.phase = 'arrived'
      ORDER BY te2.captured_at DESC, te2.id DESC
      LIMIT 1
    ) END AS station_arrived_at,
    CASE WHEN ranked.phase = 'departed' THEN NULL ELSE
      ps.max_duration_seconds
    END AS max_duration_seconds,
    o.pipeline_id,
    pl.name AS pipeline_name,
    ps.position AS pipeline_step_position,
    (SELECT COUNT(*) FROM pipeline_steps ps2 WHERE ps2.pipeline_id = o.pipeline_id) AS pipeline_total_steps,
    (SELECT SUM(ps3.max_duration_seconds) FROM pipeline_steps ps3 WHERE ps3.pipeline_id = o.pipeline_id AND ps3.max_duration_seconds IS NOT NULL) AS pipeline_expected_seconds,
    (SELECT MIN(te3.captured_at) FROM tracking_events te3 WHERE te3.tray_code = o.tray_code) AS first_event_at
  FROM jobs o
  LEFT JOIN (
    SELECT
      tray_code,
      station_id,
      captured_at,
      phase,
      ROW_NUMBER() OVER (PARTITION BY tray_code ORDER BY captured_at DESC, id DESC) AS rn
    FROM tracking_events
  ) ranked ON ranked.tray_code = o.tray_code AND ranked.rn = 1
  LEFT JOIN stations s ON s.id = ranked.station_id AND ranked.phase != 'departed'
  JOIN pipelines pl ON pl.id = o.pipeline_id
  LEFT JOIN pipeline_steps ps ON ps.pipeline_id = o.pipeline_id AND ps.station_id = ranked.station_id AND ranked.phase != 'departed'
  ORDER BY
    CASE WHEN ranked.captured_at IS NULL THEN 1 ELSE 0 END,
    ranked.captured_at ASC
`);

export function getJobBoard(): BoardJob[] {
  const rows = stmtJobBoard.all() as BoardJobRow[];
  return rows.map(toBoardJob);
}

interface RawJobHistoryRow {
  id: number;
  station_id: string;
  station_name: string;
  captured_at: string;
  phase: string;
}

const stmtJobHistoryRaw = db.prepare(`
  SELECT te.id, te.station_id, s.name AS station_name, te.captured_at, te.phase
  FROM tracking_events te
  JOIN stations s ON s.id = te.station_id
  WHERE te.tray_code = (SELECT tray_code FROM jobs WHERE id = ?)
  ORDER BY te.captured_at ASC, te.id ASC
`);

function normalizePhase(raw: string): JobHistoryPhase {
  if (raw === "arrived" || raw === "departed") return raw;
  return "scan";
}

export function buildJobHistoryEntries(rows: RawJobHistoryRow[]): JobHistoryEntry[] {
  const result: JobHistoryEntry[] = [];
  const pendingArrivedMs = new Map<string, number>();

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const atIso = toIso(row.captured_at);
    const atMs = parseUtcMs(row.captured_at);
    const phase = normalizePhase(row.phase);

    if (phase === "departed") {
      const startMs = pendingArrivedMs.get(row.station_id);
      const durationSeconds =
        startMs !== undefined ? Math.floor((atMs - startMs) / 1000) : null;
      pendingArrivedMs.delete(row.station_id);
      result.push({
        id: row.id,
        phase: "departed",
        station: row.station_name,
        at: atIso,
        durationSeconds,
      });
      continue;
    }

    if (phase === "arrived") {
      pendingArrivedMs.set(row.station_id, atMs);
      result.push({
        id: row.id,
        phase: "arrived",
        station: row.station_name,
        at: atIso,
        durationSeconds: null,
      });
      continue;
    }

    const next = rows[i + 1];
    const durationSeconds =
      next !== undefined ? Math.floor((parseUtcMs(next.captured_at) - atMs) / 1000) : null;
    result.push({
      id: row.id,
      phase: "scan",
      station: row.station_name,
      at: atIso,
      durationSeconds,
    });
  }

  return result;
}

export function getJobHistory(jobId: number): JobHistoryEntry[] {
  const exists = stmtGetById.get(jobId) as JobRow | undefined;
  if (!exists) {
    throw new AppError(404, `Job with id ${jobId} not found`);
  }
  const rows = stmtJobHistoryRaw.all(jobId) as RawJobHistoryRow[];
  return buildJobHistoryEntries(rows);
}

export async function generateQrCode(id: number): Promise<Buffer> {
  const job = getJobById(id);
  return QRCode.toBuffer(job.trayCode, { ...QR_OPTIONS, type: "png" });
}

export async function generateQrDataUrl(id: number): Promise<string> {
  const job = getJobById(id);
  return QRCode.toDataURL(job.trayCode, QR_OPTIONS);
}

const stmtListAllocations = db.prepare(`
  SELECT ja.id, ja.order_line_id, ja.job_id, ja.quantity,
         co.order_number, co.customer_name, ol.product_type
  FROM job_allocations ja
  JOIN order_lines ol ON ol.id = ja.order_line_id
  JOIN customer_orders co ON co.id = ol.customer_order_id
  WHERE ja.job_id = ?
  ORDER BY ja.id
`);

const stmtGetAllocation = db.prepare(
  `SELECT ja.id, ja.order_line_id, ja.job_id, ja.quantity,
          co.order_number, co.customer_name, ol.product_type
   FROM job_allocations ja
   JOIN order_lines ol ON ol.id = ja.order_line_id
   JOIN customer_orders co ON co.id = ol.customer_order_id
   WHERE ja.id = ? AND ja.job_id = ?`,
);

const stmtDeleteAllocation = db.prepare(
  `DELETE FROM job_allocations WHERE id = ? AND job_id = ?`,
);

const stmtOrderLineById = db.prepare(
  `SELECT id, product_type FROM order_lines WHERE id = ?`,
);

const stmtJobAvailable = db.prepare(`
  SELECT j.quantity - COALESCE(SUM(ja.quantity), 0) AS available
  FROM jobs j
  LEFT JOIN job_allocations ja ON ja.job_id = j.id
  WHERE j.id = ?
  GROUP BY j.id
`);

const stmtGetAllocationById = db.prepare(
  `SELECT ja.id, ja.order_line_id, ja.job_id, ja.quantity,
          co.order_number, co.customer_name, ol.product_type
   FROM job_allocations ja
   JOIN order_lines ol ON ol.id = ja.order_line_id
   JOIN customer_orders co ON co.id = ol.customer_order_id
   WHERE ja.id = ?`,
);

const addAllocationTx = db.transaction(
  (jobId: number, input: CreateAllocationInput): Allocation => {
    const job = getJobById(jobId);
    const lineRow = stmtOrderLineById.get(input.orderLineId) as
      | { id: number; product_type: string }
      | undefined;
    if (!lineRow) {
      throw new AppError(404, `Order line with id ${input.orderLineId} not found`);
    }
    if (lineRow.product_type !== job.productType) {
      throw new AppError(
        422,
        `Product type mismatch: job produces "${job.productType}" but order line requires "${lineRow.product_type}"`,
      );
    }
    const { available } = stmtJobAvailable.get(jobId) as { available: number };
    if (input.quantity > available) {
      throw new AppError(
        422,
        `Job ${jobId} only has ${available} items available (requested ${input.quantity})`,
      );
    }
    try {
      const result = stmtInsertAllocation.run({
        order_line_id: input.orderLineId,
        job_id: jobId,
        quantity: input.quantity,
      });
      const row = stmtGetAllocationById.get(result.lastInsertRowid) as AllocationRow;
      return toAllocation(row);
    } catch (err: unknown) {
      if (err instanceof Error && err.message.includes("UNIQUE constraint")) {
        throw new AppError(409, "Allocation already exists for this job and order line");
      }
      throw err;
    }
  },
);

export function addAllocation(jobId: number, input: CreateAllocationInput): Allocation {
  return addAllocationTx(jobId, input);
}

export function listAllocations(jobId: number): Allocation[] {
  const rows = stmtListAllocations.all(jobId) as AllocationRow[];
  return rows.map(toAllocation);
}

export function removeAllocation(jobId: number, allocationId: number): void {
  const row = stmtGetAllocation.get(allocationId, jobId) as AllocationRow | undefined;
  if (!row) {
    throw new AppError(404, `Allocation ${allocationId} not found on job ${jobId}`);
  }
  stmtDeleteAllocation.run(allocationId, jobId);
}

const stmtUpdateQuantity = db.prepare(`UPDATE jobs SET quantity = quantity + @delta WHERE id = @id`);

const stmtUpdateStatus = db.prepare(`UPDATE jobs SET status = @status WHERE id = @id`);

const stmtJobByTrayCode = db.prepare(`SELECT id, status, pipeline_id FROM jobs WHERE tray_code = ?`);

const stmtDepartedStationCount = db.prepare(`
  SELECT COUNT(DISTINCT te.station_id) AS cnt
  FROM tracking_events te
  WHERE te.tray_code = ? AND te.phase = 'departed'
`);

const stmtPipelineStepCount = db.prepare(`
  SELECT COUNT(*) AS cnt FROM pipeline_steps WHERE pipeline_id = ?
`);

export function packIntoJob(jobId: number, additionalQuantity: number): void {
  stmtUpdateQuantity.run({ id: jobId, delta: additionalQuantity });
}

export function createJobRaw(productType: string, quantity: number, pipelineId: string): number {
  const { next_id: nextId } = stmtNextId.get() as { next_id: number };
  stmtInsert.run({
    id: nextId,
    job_number: formatJobNumber(nextId),
    product_type: productType,
    quantity,
    notes: "",
    tray_code: formatTrayCode(nextId),
    pipeline_id: pipelineId,
  });
  return nextId;
}

export function onTrackingEvent(trayCode: string): void {
  const job = stmtJobByTrayCode.get(trayCode) as
    | { id: number; status: string; pipeline_id: string }
    | undefined;
  if (!job) return;

  if (job.status === "pending") {
    stmtUpdateStatus.run({ id: job.id, status: "in_progress" });
    return;
  }

  if (job.status === "in_progress") {
    const { cnt: departed } = stmtDepartedStationCount.get(trayCode) as { cnt: number };
    const { cnt: totalSteps } = stmtPipelineStepCount.get(job.pipeline_id) as { cnt: number };
    if (totalSteps > 0 && departed >= totalSteps) {
      stmtUpdateStatus.run({ id: job.id, status: "completed" });
    }
  }
}
