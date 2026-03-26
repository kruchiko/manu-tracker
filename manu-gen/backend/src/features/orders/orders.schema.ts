import { z } from "zod";
import { toIso } from "../../shared/datetime.js";

export const createOrderSchema = z.object({
  customerName: z.string().min(1, "customerName is required"),
  productType: z.string().min(1, "productType is required"),
  quantity: z.number().int().min(1, "quantity must be at least 1"),
  notes: z.string().optional().default(""),
  pipelineId: z.string().min(1, "pipelineId is required"),
});

export type CreateOrderInput = z.infer<typeof createOrderSchema>;

export interface OrderRow {
  id: number;
  order_number: string;
  customer_name: string;
  product_type: string;
  quantity: number;
  notes: string;
  tray_code: string;
  created_at: string;
  pipeline_id: string;
  pipeline_name: string;
}

export interface Order {
  id: number;
  orderNumber: string;
  customerName: string;
  productType: string;
  quantity: number;
  notes: string;
  trayCode: string;
  createdAt: string;
  pipelineId: string;
  pipelineName: string;
}

export function toOrder(row: OrderRow): Order {
  return {
    id: row.id,
    orderNumber: row.order_number,
    customerName: row.customer_name,
    productType: row.product_type,
    quantity: row.quantity,
    notes: row.notes,
    trayCode: row.tray_code,
    createdAt: row.created_at,
    pipelineId: row.pipeline_id,
    pipelineName: row.pipeline_name,
  };
}

export interface BoardOrderRow {
  id: number;
  order_number: string;
  customer_name: string;
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

export interface BoardOrder {
  id: number;
  orderNumber: string;
  customerName: string;
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

export function toBoardOrder(row: BoardOrderRow): BoardOrder {
  const firstEventMs = row.first_event_at ? new Date(row.first_event_at + "Z").getTime() : null;
  const elapsedSeconds =
    firstEventMs !== null ? Math.floor((Date.now() - firstEventMs) / 1000) : null;

  return {
    id: row.id,
    orderNumber: row.order_number,
    customerName: row.customer_name,
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

export type OrderHistoryPhase = "arrived" | "departed" | "scan";

export interface OrderHistoryEntry {
  id: number;
  phase: OrderHistoryPhase;
  station: string;
  at: string;
  durationSeconds: number | null;
}
