import { z } from "zod";

const stepSchema = z
  .object({
    stationId: z.string().min(1, "Station is required"),
    minDurationSeconds: z.number().int().min(1).nullable().optional().default(null),
    maxDurationSeconds: z.number().int().min(1).nullable().optional().default(null),
    minCapacity: z.number().int().min(1).nullable().optional().default(null),
    maxCapacity: z.number().int().min(1).nullable().optional().default(null),
  })
  .superRefine((data, ctx) => {
    if (
      data.minDurationSeconds !== null &&
      data.maxDurationSeconds !== null &&
      data.minDurationSeconds > data.maxDurationSeconds
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Min duration must be less than or equal to max duration",
        path: ["minDurationSeconds"],
      });
    }
    if (
      data.minCapacity !== null &&
      data.maxCapacity !== null &&
      data.minCapacity > data.maxCapacity
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Min items per tray must be less than or equal to max",
        path: ["minCapacity"],
      });
    }
  });

export const createPipelineSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional().default(""),
  productType: z.string().min(1, "Product type is required"),
  steps: z.array(stepSchema).min(1, "At least one step is required"),
});

export type CreatePipelineFormValues = z.infer<typeof createPipelineSchema>;

export type StepFormValue = CreatePipelineFormValues["steps"][number];
