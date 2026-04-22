import type { PipelineStep } from "../../pipelines/pipelines.types";
import type { JobHistoryEntry } from "../jobs.types";

type StepStatus = "completed" | "current" | "upcoming";

export interface ResolvedPipelineStep {
  step: PipelineStep;
  status: StepStatus;
  actualSeconds: number | null;
}

export function resolveStepStatuses(
  steps: PipelineStep[],
  currentStepPosition: number,
  historyEntries: JobHistoryEntry[],
): ResolvedPipelineStep[] {
  const durationByStation = new Map<string, number>();
  const departedStations = new Set<string>();

  for (const entry of historyEntries) {
    if (entry.phase === "departed") {
      departedStations.add(entry.station);
    }
    if (entry.durationSeconds === null || entry.durationSeconds <= 0) continue;
    if (entry.phase !== "departed" && entry.phase !== "scan") continue;
    durationByStation.set(
      entry.station,
      (durationByStation.get(entry.station) ?? 0) + entry.durationSeconds,
    );
  }

  return steps.map((step) => {
    let status: StepStatus;
    if (step.position === currentStepPosition && currentStepPosition > 0) {
      status = "current";
    } else if (departedStations.has(step.stationName) || step.position < currentStepPosition) {
      status = "completed";
    } else {
      status = "upcoming";
    }

    return {
      step,
      status,
      actualSeconds: durationByStation.get(step.stationName) ?? null,
    };
  });
}

export function countCompletedSteps(
  steps: PipelineStep[],
  currentStepPosition: number,
  historyEntries: JobHistoryEntry[],
): number {
  return resolveStepStatuses(steps, currentStepPosition, historyEntries).filter(
    (r) => r.status === "completed",
  ).length;
}
