import { z } from "zod";

const stepSchema = z.object({
  stationId: z.string().min(1, "Station is required"),
  maxDurationSeconds: z.number().int().min(1).nullable().optional().default(null),
  maxCapacity: z.number().int().min(1).nullable().optional().default(null),
});

export const createPipelineSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional().default(""),
  productType: z.string().min(1, "Product type is required"),
  steps: z.array(stepSchema).min(1, "At least one step is required"),
});

export type CreatePipelineFormValues = z.infer<typeof createPipelineSchema>;

export type StepFormValue = CreatePipelineFormValues["steps"][number];
