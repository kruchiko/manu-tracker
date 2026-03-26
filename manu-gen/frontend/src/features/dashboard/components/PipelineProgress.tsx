import type { PipelineStep } from "../../pipelines/pipelines.types";
import type { BoardOrderPipeline, OrderHistoryEntry } from "../dashboard.types";
import { formatDuration } from "../dashboard.utils";

interface PipelineProgressProps {
  pipeline: BoardOrderPipeline;
  steps: PipelineStep[];
  historyEntries: OrderHistoryEntry[];
}

type StepStatus = "completed" | "current" | "upcoming";

interface ResolvedStep {
  step: PipelineStep;
  status: StepStatus;
  actualSeconds: number | null;
}

function resolveStepStatuses(
  steps: PipelineStep[],
  currentStepPosition: number,
  historyEntries: OrderHistoryEntry[],
): ResolvedStep[] {
  const durationByStation = new Map<string, number>();
  for (const entry of historyEntries) {
    if (entry.durationSeconds === null || entry.durationSeconds <= 0) continue;
    if (entry.phase !== "departed" && entry.phase !== "scan") continue;
    durationByStation.set(
      entry.station,
      (durationByStation.get(entry.station) ?? 0) + entry.durationSeconds,
    );
  }

  return steps.map((step) => {
    let status: StepStatus;
    if (step.position < currentStepPosition) {
      status = "completed";
    } else if (step.position === currentStepPosition) {
      status = "current";
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

function StepNode({ resolved }: { resolved: ResolvedStep }) {
  const { step, status, actualSeconds } = resolved;

  const ringColor =
    status === "completed"
      ? "border-green-500 bg-green-500"
      : status === "current"
        ? "border-blue-500 bg-blue-500"
        : "border-gray-300 bg-white";

  const iconContent =
    status === "completed" ? (
      <svg className="h-3 w-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
      </svg>
    ) : status === "current" ? (
      <span className="block h-2 w-2 animate-pulse rounded-full bg-white" />
    ) : null;

  const overThreshold =
    step.maxDurationSeconds !== null &&
    actualSeconds !== null &&
    actualSeconds > step.maxDurationSeconds;

  return (
    <div className="flex flex-col items-center gap-1">
      <div
        className={`flex h-6 w-6 items-center justify-center rounded-full border-2 ${ringColor}`}
      >
        {iconContent}
      </div>
      <p className={`max-w-[80px] truncate text-center text-xs font-medium ${
        status === "upcoming" ? "text-gray-400" : "text-gray-700"
      }`}>
        {step.stationName}
      </p>
      <p className={`text-center text-[10px] ${overThreshold ? "font-medium text-red-600" : "text-gray-400"}`}>
        {status === "upcoming"
          ? (step.maxDurationSeconds !== null ? `~${formatDuration(step.maxDurationSeconds)}` : "")
          : (actualSeconds !== null ? formatDuration(actualSeconds) : (status === "current" ? "..." : ""))}
      </p>
    </div>
  );
}

function Connector({ completed }: { completed: boolean }) {
  return (
    <div className={`mt-3 h-0.5 flex-1 ${completed ? "bg-green-400" : "bg-gray-200"}`} />
  );
}

export function PipelineProgress({ pipeline, steps, historyEntries }: PipelineProgressProps) {
  const resolved = resolveStepStatuses(steps, pipeline.stepPosition, historyEntries);

  const remaining =
    pipeline.expectedSeconds !== null && pipeline.elapsedSeconds !== null
      ? pipeline.expectedSeconds - pipeline.elapsedSeconds
      : null;

  return (
    <div className="rounded-lg border bg-white p-5 shadow-sm">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-700">
          Pipeline: {pipeline.name}
        </h3>
        {remaining !== null && (
          <span
            className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
              remaining < 0
                ? "bg-red-50 text-red-700"
                : "bg-green-50 text-green-700"
            }`}
          >
            {remaining >= 0
              ? `${formatDuration(remaining)} remaining`
              : `Overdue by ${formatDuration(Math.abs(remaining))}`}
          </span>
        )}
      </div>

      <div className="flex items-start">
        {resolved.map((r, i) => (
          <div key={r.step.id} className="flex flex-1 items-start">
            <StepNode resolved={r} />
            {i < resolved.length - 1 && (
              <Connector completed={r.status === "completed"} />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
