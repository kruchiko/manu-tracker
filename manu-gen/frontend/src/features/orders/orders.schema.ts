import { z } from "zod";

export const createOrderSchema = z.object({
  customerName: z.string().min(1, "Customer name is required"),
  productType: z.string().min(1, "Product type is required"),
  quantity: z
    .number({ error: "Quantity must be a number" })
    .int("Quantity must be a whole number")
    .min(1, "Quantity must be at least 1"),
  notes: z.string().optional(),
});

export type CreateOrderFormValues = z.infer<typeof createOrderSchema>;
