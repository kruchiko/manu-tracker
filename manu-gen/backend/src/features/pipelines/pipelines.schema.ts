import { z } from "zod";

const stepSchema = z
  .object({
    stationId: z.string().min(1, "stationId is required"),
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
        message: "minDurationSeconds must be less than or equal to maxDurationSeconds",
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
        message: "minCapacity must be less than or equal to maxCapacity",
        path: ["minCapacity"],
      });
    }
  });

export const createPipelineSchema = z.object({
  name: z.string().min(1, "name is required"),
  description: z.string().optional().default(""),
  productType: z.string().min(1, "productType is required"),
  steps: z.array(stepSchema).min(1, "at least one step is required"),
});

export type CreatePipelineInput = z.input<typeof createPipelineSchema>;

export const updatePipelineSchema = z.object({
  name: z.string().min(1, "name is required").optional(),
  description: z.string().optional(),
  productType: z.string().min(1).optional(),
});

export type UpdatePipelineInput = z.input<typeof updatePipelineSchema>;

export const replacePipelineStepsSchema = z.object({
  steps: z.array(stepSchema).min(1, "at least one step is required"),
});

export type ReplacePipelineStepsInput = z.infer<typeof replacePipelineStepsSchema>;

/** Full replace of metadata and steps in one request (atomic on the server). */
export const updatePipelineWithStepsSchema = z.object({
  name: z.string().min(1, "name is required"),
  description: z.string().optional().default(""),
  productType: z.string().min(1, "productType is required"),
  steps: z.array(stepSchema).min(1, "at least one step is required"),
});

export type UpdatePipelineWithStepsInput = z.infer<typeof updatePipelineWithStepsSchema>;

export interface PipelineRow {
  id: string;
  name: string;
  description: string;
  product_type: string;
  created_at: string;
}

export interface PipelineStepRow {
  id: number;
  pipeline_id: string;
  station_id: string;
  position: number;
  min_duration_seconds: number | null;
  max_duration_seconds: number | null;
  min_capacity: number | null;
  max_capacity: number | null;
}

export interface PipelineStep {
  id: number;
  stationId: string;
  stationName: string;
  position: number;
  minDurationSeconds: number | null;
  maxDurationSeconds: number | null;
  minCapacity: number | null;
  maxCapacity: number | null;
}

export interface Pipeline {
  id: string;
  name: string;
  description: string;
  productType: string;
  createdAt: string;
  steps: PipelineStep[];
  totalExpectedSeconds: number | null;
  effectiveCapacity: number | null;
}

export interface PipelineStepJoinRow extends PipelineStepRow {
  station_name: string;
}

export function toPipelineStep(row: PipelineStepJoinRow): PipelineStep {
  return {
    id: row.id,
    stationId: row.station_id,
    stationName: row.station_name,
    position: row.position,
    minDurationSeconds: row.min_duration_seconds,
    maxDurationSeconds: row.max_duration_seconds,
    minCapacity: row.min_capacity,
    maxCapacity: row.max_capacity,
  };
}

export function computeEffectiveCapacity(steps: PipelineStep[]): number | null {
  const caps = steps.map((s) => s.maxCapacity).filter((c): c is number => c !== null);
  return caps.length > 0 ? Math.min(...caps) : null;
}

export function toPipeline(row: PipelineRow, stepRows: PipelineStepJoinRow[]): Pipeline {
  const steps = stepRows.map(toPipelineStep);
  const allHaveDuration = steps.length > 0 && steps.every((s) => s.maxDurationSeconds !== null);
  const totalExpectedSeconds = allHaveDuration
    ? steps.reduce((sum, s) => sum + s.maxDurationSeconds!, 0)
    : null;

  return {
    id: row.id,
    name: row.name,
    description: row.description,
    productType: row.product_type,
    createdAt: row.created_at,
    steps,
    totalExpectedSeconds,
    effectiveCapacity: computeEffectiveCapacity(steps),
  };
}
