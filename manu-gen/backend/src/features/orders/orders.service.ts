import QRCode from "qrcode";
import db from "../../db.js";
import { AppError } from "../../shared/errors/app-error.js";
import type { CreateOrderInput, Order } from "./orders.schema.js";

function formatOrderNumber(id: number): string {
  return `ORD-${String(id).padStart(4, "0")}`;
}

function formatTrayCode(id: number): string {
  return `TRAY-${String(id).padStart(4, "0")}`;
}

const insertOrder = db.prepare(`
  INSERT INTO orders (order_number, customer_name, product_type, quantity, notes, tray_code)
  VALUES ('', @customer_name, @product_type, @quantity, @notes, '')
`);

const updateCodes = db.prepare(
  "UPDATE orders SET order_number = ?, tray_code = ? WHERE id = ?",
);

const createOrderTx = db.transaction((input: CreateOrderInput) => {
  const result = insertOrder.run({
    customer_name: input.customer_name,
    product_type: input.product_type,
    quantity: input.quantity,
    notes: input.notes ?? "",
  });

  const id = Number(result.lastInsertRowid);
  updateCodes.run(formatOrderNumber(id), formatTrayCode(id), id);
  return id;
});

export function createOrder(input: CreateOrderInput): Order {
  const id = createOrderTx(input);
  return getOrderById(id);
}

export function getOrderById(id: number): Order {
  const order = db.prepare("SELECT * FROM orders WHERE id = ?").get(id) as Order | undefined;
  if (!order) {
    throw new AppError(404, `Order with id ${id} not found`);
  }
  return order;
}

export function getOrderByTrayCode(trayCode: string): Order {
  const order = db.prepare("SELECT * FROM orders WHERE tray_code = ?").get(trayCode) as
    | Order
    | undefined;
  if (!order) {
    throw new AppError(404, `Order with tray code ${trayCode} not found`);
  }
  return order;
}

export function listOrders(): Order[] {
  return db.prepare("SELECT * FROM orders ORDER BY id DESC").all() as Order[];
}

export async function generateQrCode(id: number): Promise<Buffer> {
  const order = getOrderById(id);
  return QRCode.toBuffer(order.tray_code, {
    type: "png",
    width: 300,
    margin: 2,
    errorCorrectionLevel: "H",
  });
}

export async function generateQrDataUrl(id: number): Promise<string> {
  const order = getOrderById(id);
  return QRCode.toDataURL(order.tray_code, {
    width: 300,
    margin: 2,
    errorCorrectionLevel: "H",
  });
}
