import { z } from "zod";

export const createPipelineSchema = z.object({
  name: z.string().min(1, "name is required"),
  description: z.string().optional().default(""),
  steps: z
    .array(
      z.object({
        stationId: z.string().min(1, "stationId is required"),
        maxDurationSeconds: z.number().int().min(1).nullable().optional().default(null),
      }),
    )
    .min(1, "at least one step is required"),
});

export type CreatePipelineInput = z.infer<typeof createPipelineSchema>;

export const updatePipelineSchema = z.object({
  name: z.string().min(1, "name is required").optional(),
  description: z.string().optional(),
});

export type UpdatePipelineInput = z.input<typeof updatePipelineSchema>;

export const replacePipelineStepsSchema = z.object({
  steps: z
    .array(
      z.object({
        stationId: z.string().min(1, "stationId is required"),
        maxDurationSeconds: z.number().int().min(1).nullable().optional().default(null),
      }),
    )
    .min(1, "at least one step is required"),
});

export type ReplacePipelineStepsInput = z.infer<typeof replacePipelineStepsSchema>;

export interface PipelineRow {
  id: string;
  name: string;
  description: string;
  created_at: string;
}

export interface PipelineStepRow {
  id: number;
  pipeline_id: string;
  station_id: string;
  position: number;
  max_duration_seconds: number | null;
}

export interface PipelineStep {
  id: number;
  stationId: string;
  stationName: string;
  position: number;
  maxDurationSeconds: number | null;
}

export interface Pipeline {
  id: string;
  name: string;
  description: string;
  createdAt: string;
  steps: PipelineStep[];
  totalExpectedSeconds: number | null;
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
  };
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
    createdAt: row.created_at,
    steps,
    totalExpectedSeconds,
  };
}
