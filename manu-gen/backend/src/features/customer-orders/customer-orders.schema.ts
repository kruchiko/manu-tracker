import { z } from "zod";

export const createCustomerOrderSchema = z.object({
  customerName: z.string().min(1, "customerName is required"),
  notes: z.string().optional().default(""),
  dueDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "dueDate must be YYYY-MM-DD").nullable().optional().default(null),
  lines: z
    .array(
      z.object({
        productType: z.string().min(1, "productType is required"),
        quantity: z.number().int().min(1, "quantity must be at least 1"),
      }),
    )
    .min(1, "at least one line is required"),
});

export type CreateCustomerOrderInput = z.infer<typeof createCustomerOrderSchema>;

export const updateCustomerOrderSchema = z.object({
  customerName: z.string().min(1).optional(),
  notes: z.string().optional(),
  status: z.enum(["open", "in_progress", "fulfilled", "cancelled"]).optional(),
  dueDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "dueDate must be YYYY-MM-DD").nullable().optional(),
});

export type UpdateCustomerOrderInput = z.infer<typeof updateCustomerOrderSchema>;

export type CustomerOrderStatus = "open" | "in_progress" | "fulfilled" | "cancelled";

export interface CustomerOrderRow {
  id: number;
  order_number: string;
  customer_name: string;
  notes: string;
  status: string;
  due_date: string | null;
  created_at: string;
}

export interface OrderLineRow {
  id: number;
  customer_order_id: number;
  product_type: string;
  quantity: number;
}

export interface LineAllocation {
  id: number;
  jobId: number;
  jobNumber: string;
  quantity: number;
}

export interface OrderLine {
  id: number;
  productType: string;
  quantity: number;
  allocatedQuantity: number;
  fulfilledQuantity: number;
  allocations: LineAllocation[];
}

export interface CustomerOrder {
  id: number;
  orderNumber: string;
  customerName: string;
  notes: string;
  status: CustomerOrderStatus;
  dueDate: string | null;
  createdAt: string;
  lines: OrderLine[];
  allocationPct: number;
  fulfillmentPct: number;
}

export interface CustomerOrderSummary {
  id: number;
  orderNumber: string;
  customerName: string;
  status: CustomerOrderStatus;
  dueDate: string | null;
  createdAt: string;
  lineCount: number;
  allocationPct: number;
  fulfillmentPct: number;
}

export function toCustomerOrderSummary(
  row: CustomerOrderRow,
  lineCount: number,
  pcts: { allocationPct: number; fulfillmentPct: number },
): CustomerOrderSummary {
  return {
    id: row.id,
    orderNumber: row.order_number,
    customerName: row.customer_name,
    status: row.status as CustomerOrderStatus,
    dueDate: row.due_date,
    createdAt: row.created_at,
    lineCount,
    ...pcts,
  };
}
