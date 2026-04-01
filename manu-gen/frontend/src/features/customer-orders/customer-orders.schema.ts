import { z } from "zod";

const orderLineSchema = z.object({
  productType: z.string().min(1, "Product type is required"),
  quantity: z.coerce.number().int().min(1, "Quantity must be at least 1"),
});

export const createCustomerOrderSchema = z.object({
  customerName: z.string().min(1, "Customer name is required"),
  notes: z.string().default(""),
  dueDate: z.string().default(""),
  lines: z.array(orderLineSchema).min(1, "At least one line item is required"),
});

export type CreateCustomerOrderFormValues = z.output<typeof createCustomerOrderSchema>;
