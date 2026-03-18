import { z } from "zod";

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
}

function toIso(raw: string): string {
  return raw.replace(" ", "T").replace(/Z$/, "");
}

function parseUtcMs(raw: string): number {
  return new Date(toIso(raw) + "Z").getTime();
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
  };
}

export interface OrderHistoryRow {
  station_name: string;
  arrived_at: string;
  next_arrived_at: string | null;
}

export interface OrderHistoryEntry {
  station: string;
  arrivedAt: string;
  durationSeconds: number | null;
}

export function toOrderHistoryEntry(row: OrderHistoryRow): OrderHistoryEntry {
  let durationSeconds: number | null = null;
  if (row.next_arrived_at) {
    const arrived = parseUtcMs(row.arrived_at);
    const next = parseUtcMs(row.next_arrived_at);
    durationSeconds = Math.floor((next - arrived) / 1000);
  }
  return {
    station: row.station_name,
    arrivedAt: toIso(row.arrived_at),
    durationSeconds,
  };
}
