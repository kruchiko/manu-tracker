import { z } from "zod";

export const createPipelineSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional().default(""),
  steps: z
    .array(
      z.object({
        stationId: z.string().min(1, "Station is required"),
        maxDurationSeconds: z.number().int().min(1).nullable().optional().default(null),
      }),
    )
    .min(1, "At least one step is required"),
});

export type CreatePipelineFormValues = z.infer<typeof createPipelineSchema>;

export type StepFormValue = CreatePipelineFormValues["steps"][number];
