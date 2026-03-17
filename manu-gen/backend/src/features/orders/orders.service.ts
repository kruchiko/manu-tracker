import QRCode from "qrcode";
import db from "../../db.js";
import { AppError } from "../../shared/errors/app-error.js";
import type { CreateOrderInput, Order, OrderRow } from "./orders.schema.js";
import { toOrder } from "./orders.schema.js";

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

export async function generateQrCode(id: number): Promise<Buffer> {
  const order = getOrderById(id);
  return QRCode.toBuffer(order.trayCode, { ...QR_OPTIONS, type: "png" });
}

export async function generateQrDataUrl(id: number): Promise<string> {
  const order = getOrderById(id);
  return QRCode.toDataURL(order.trayCode, QR_OPTIONS);
}
