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
