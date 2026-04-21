import type { StepFormValue } from "./pipelines.schema";

/** Ensures JSON bodies include explicit nulls (JSON.stringify omits undefined keys). */
export function serializePipelineStepsForApi(steps: StepFormValue[]): StepFormValue[] {
  return steps.map((s) => ({
    stationId: s.stationId,
    minDurationSeconds: s.minDurationSeconds ?? null,
    maxDurationSeconds: s.maxDurationSeconds ?? null,
    minCapacity: s.minCapacity ?? null,
    maxCapacity: s.maxCapacity ?? null,
  }));
}
