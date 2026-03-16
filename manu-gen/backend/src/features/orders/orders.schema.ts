import { z } from "zod";

export const createOrderSchema = z.object({
  customer_name: z.string().min(1, "customer_name is required"),
  product_type: z.string().min(1, "product_type is required"),
  quantity: z.number().int().min(1, "quantity must be at least 1"),
  notes: z.string().optional().default(""),
});

export type CreateOrderInput = z.input<typeof createOrderSchema>;

export interface Order {
  id: number;
  order_number: string;
  customer_name: string;
  product_type: string;
  quantity: number;
  notes: string;
  tray_code: string;
  created_at: string;
}
