import { z } from "zod";

const stepSchema = z.object({
  stationId: z.string().min(1, "stationId is required"),
  maxDurationSeconds: z.number().int().min(1).nullable().optional().default(null),
  maxCapacity: z.number().int().min(1).nullable().optional().default(null),
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
  max_duration_seconds: number | null;
  max_capacity: number | null;
}

export interface PipelineStep {
  id: number;
  stationId: string;
  stationName: string;
  position: number;
  maxDurationSeconds: number | null;
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
    maxDurationSeconds: row.max_duration_seconds,
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
