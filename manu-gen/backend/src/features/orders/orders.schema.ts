import { z } from "zod";
import { toIso } from "../../shared/datetime.js";

export const createOrderSchema = z.object({
  customerName: z.string().min(1, "customerName is required"),
  productType: z.string().min(1, "productType is required"),
  quantity: z.number().int().min(1, "quantity must be at least 1"),
  notes: z.string().optional().default(""),
});

export type CreateOrderInput = z.input<typeof createOrderSchema>;

export interface OrderRow {
  id: number;
  order_number: string;
  customer_name: string;
  product_type: string;
  quantity: number;
  notes: string;
  tray_code: string;
  created_at: string;
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
}

export function toBoardOrder(row: BoardOrderRow): BoardOrder {
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
