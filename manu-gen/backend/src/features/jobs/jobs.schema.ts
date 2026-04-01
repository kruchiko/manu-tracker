import { z } from "zod";
import { toIso } from "../../shared/datetime.js";

export const createJobSchema = z.object({
  productType: z.string().min(1, "productType is required"),
  quantity: z.number().int().min(1, "quantity must be at least 1"),
  notes: z.string().optional().default(""),
  pipelineId: z.string().min(1, "pipelineId is required"),
});

export type CreateJobInput = z.infer<typeof createJobSchema>;

export interface JobRow {
  id: number;
  job_number: string;
  product_type: string;
  quantity: number;
  allocated_quantity: number;
  notes: string;
  tray_code: string;
  created_at: string;
  pipeline_id: string;
  pipeline_name: string;
}

export interface Job {
  id: number;
  jobNumber: string;
  productType: string;
  quantity: number;
  allocatedQuantity: number;
  notes: string;
  trayCode: string;
  createdAt: string;
  pipelineId: string;
  pipelineName: string;
}

export function toJob(row: JobRow): Job {
  return {
    id: row.id,
    jobNumber: row.job_number,
    productType: row.product_type,
    quantity: row.quantity,
    allocatedQuantity: row.allocated_quantity ?? 0,
    notes: row.notes,
    trayCode: row.tray_code,
    createdAt: row.created_at,
    pipelineId: row.pipeline_id,
    pipelineName: row.pipeline_name,
  };
}

export interface BoardJobRow {
  id: number;
  job_number: string;
  product_type: string;
  tray_code: string;
  created_at: string;
  station_id: string | null;
  station_name: string | null;
  last_seen_at: string | null;
  station_arrived_at: string | null;
  max_duration_seconds: number | null;
  pipeline_id: string;
  pipeline_name: string;
  pipeline_step_position: number | null;
  pipeline_total_steps: number;
  pipeline_expected_seconds: number | null;
  first_event_at: string | null;
}

export interface BoardJob {
  id: number;
  jobNumber: string;
  productType: string;
  trayCode: string;
  createdAt: string;
  currentStation: { id: string; name: string } | null;
  lastSeenAt: string | null;
  stationArrivedAt: string | null;
  maxDurationSeconds: number | null;
  pipeline: {
    id: string;
    name: string;
    stepPosition: number;
    totalSteps: number;
    expectedSeconds: number | null;
    elapsedSeconds: number | null;
  };
}

export function toBoardJob(row: BoardJobRow): BoardJob {
  const firstEventMs = row.first_event_at ? new Date(row.first_event_at + "Z").getTime() : null;
  const elapsedSeconds =
    firstEventMs !== null ? Math.floor((Date.now() - firstEventMs) / 1000) : null;

  return {
    id: row.id,
    jobNumber: row.job_number,
    productType: row.product_type,
    trayCode: row.tray_code,
    createdAt: toIso(row.created_at),
    currentStation:
      row.station_id && row.station_name
        ? { id: row.station_id, name: row.station_name }
        : null,
    lastSeenAt: row.last_seen_at ? toIso(row.last_seen_at) : null,
    stationArrivedAt: row.station_arrived_at ? toIso(row.station_arrived_at) : null,
    maxDurationSeconds: row.max_duration_seconds ?? null,
    pipeline: {
      id: row.pipeline_id,
      name: row.pipeline_name,
      stepPosition: row.pipeline_step_position ?? 0,
      totalSteps: row.pipeline_total_steps,
      expectedSeconds: row.pipeline_expected_seconds,
      elapsedSeconds,
    },
  };
}

export type JobHistoryPhase = "arrived" | "departed" | "scan";

export interface JobHistoryEntry {
  id: number;
  phase: JobHistoryPhase;
  station: string;
  at: string;
  durationSeconds: number | null;
}

export const createAllocationSchema = z.object({
  orderLineId: z.number().int().min(1, "orderLineId is required"),
  quantity: z.number().int().min(1, "quantity must be at least 1"),
});

export type CreateAllocationInput = z.infer<typeof createAllocationSchema>;

export interface AllocationRow {
  id: number;
  order_line_id: number;
  job_id: number;
  quantity: number;
  order_number: string;
  customer_name: string;
  product_type: string;
}

export interface Allocation {
  id: number;
  orderLineId: number;
  jobId: number;
  quantity: number;
  orderNumber: string;
  customerName: string;
  productType: string;
}

export function toAllocation(row: AllocationRow): Allocation {
  return {
    id: row.id,
    orderLineId: row.order_line_id,
    jobId: row.job_id,
    quantity: row.quantity,
    orderNumber: row.order_number,
    customerName: row.customer_name,
    productType: row.product_type,
  };
}
