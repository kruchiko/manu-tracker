import QRCode from "qrcode";
import db from "../../db.js";
import { AppError } from "../../shared/errors/app-error.js";
import { parseUtcMs, toIso } from "../../shared/datetime.js";
import type {
  CreateOrderInput,
  Order,
  OrderRow,
  BoardOrderRow,
  BoardOrder,
  OrderHistoryEntry,
  OrderHistoryPhase,
} from "./orders.schema.js";
import { toOrder, toBoardOrder } from "./orders.schema.js";

const QR_OPTIONS = {
  width: 300,
  margin: 2,
  errorCorrectionLevel: "H",
} as const;

const ORDER_COLUMNS = "id, order_number, customer_name, product_type, quantity, notes, tray_code, created_at";

function formatOrderNumber(id: number): string {
  return `ORD-${String(id).padStart(4, "0")}`;
}

function formatTrayCode(id: number): string {
  return `TRAY-${String(id).padStart(4, "0")}`;
}

const stmtNextId = db.prepare("SELECT COALESCE(MAX(id), 0) + 1 AS next_id FROM orders");

const stmtInsert = db.prepare(`
  INSERT INTO orders (id, order_number, customer_name, product_type, quantity, notes, tray_code)
  VALUES (@id, @order_number, @customer_name, @product_type, @quantity, @notes, @tray_code)
`);

const stmtGetById = db.prepare(`SELECT ${ORDER_COLUMNS} FROM orders WHERE id = ?`);

const stmtGetByTrayCode = db.prepare(`SELECT ${ORDER_COLUMNS} FROM orders WHERE tray_code = ?`);

const stmtListOrders = db.prepare(
  `SELECT ${ORDER_COLUMNS} FROM orders ORDER BY id DESC LIMIT ? OFFSET ?`,
);

const createOrderTx = db.transaction((input: CreateOrderInput): number => {
  const { next_id: nextId } = stmtNextId.get() as { next_id: number };

  stmtInsert.run({
    id: nextId,
    order_number: formatOrderNumber(nextId),
    customer_name: input.customerName,
    product_type: input.productType,
    quantity: input.quantity,
    notes: input.notes ?? "",
    tray_code: formatTrayCode(nextId),
  });

  return nextId;
});

export function createOrder(input: CreateOrderInput): Order {
  const id = createOrderTx(input);
  return getOrderById(id);
}

export function getOrderById(id: number): Order {
  const row = stmtGetById.get(id) as OrderRow | undefined;
  if (!row) {
    throw new AppError(404, `Order with id ${id} not found`);
  }
  return toOrder(row);
}

export function getOrderByTrayCode(trayCode: string): Order {
  const row = stmtGetByTrayCode.get(trayCode) as OrderRow | undefined;
  if (!row) {
    throw new AppError(404, `Order with tray code ${trayCode} not found`);
  }
  return toOrder(row);
}

export function listOrders({ limit = 50, offset = 0 }: { limit?: number; offset?: number } = {}): Order[] {
  const rows = stmtListOrders.all(limit, offset) as OrderRow[];
  return rows.map(toOrder);
}

const stmtOrderBoard = db.prepare(`
  SELECT
    o.id,
    o.order_number,
    o.customer_name,
    o.product_type,
    o.tray_code,
    o.created_at,
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
    ) END AS station_arrived_at
  FROM orders o
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
  ORDER BY
    CASE WHEN ranked.captured_at IS NULL THEN 1 ELSE 0 END,
    ranked.captured_at ASC
`);

export function getOrderBoard(): BoardOrder[] {
  const rows = stmtOrderBoard.all() as BoardOrderRow[];
  return rows.map(toBoardOrder);
}

interface RawOrderHistoryRow {
  id: number;
  station_id: string;
  station_name: string;
  captured_at: string;
  phase: string;
}

const stmtOrderHistoryRaw = db.prepare(`
  SELECT te.id, te.station_id, s.name AS station_name, te.captured_at, te.phase
  FROM tracking_events te
  JOIN stations s ON s.id = te.station_id
  WHERE te.tray_code = (SELECT tray_code FROM orders WHERE id = ?)
  ORDER BY te.captured_at ASC, te.id ASC
`);

function normalizePhase(raw: string): OrderHistoryPhase {
  if (raw === "arrived" || raw === "departed") return raw;
  return "scan";
}

export function buildOrderHistoryEntries(rows: RawOrderHistoryRow[]): OrderHistoryEntry[] {
  const result: OrderHistoryEntry[] = [];
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

export function getOrderHistory(orderId: number): OrderHistoryEntry[] {
  const exists = stmtGetById.get(orderId) as OrderRow | undefined;
  if (!exists) {
    throw new AppError(404, `Order with id ${orderId} not found`);
  }
  const rows = stmtOrderHistoryRaw.all(orderId) as RawOrderHistoryRow[];
  return buildOrderHistoryEntries(rows);
}

export async function generateQrCode(id: number): Promise<Buffer> {
  const order = getOrderById(id);
  return QRCode.toBuffer(order.trayCode, { ...QR_OPTIONS, type: "png" });
}

export async function generateQrDataUrl(id: number): Promise<string> {
  const order = getOrderById(id);
  return QRCode.toDataURL(order.trayCode, QR_OPTIONS);
}
