import { Check } from "lucide-react";
import type { PipelineStep } from "../../pipelines/pipelines.types";
import type { JobHistoryEntry, JobPipelineProgress } from "../jobs.types";
import { formatDuration } from "../utils/duration";
import styles from "./PipelineProgress.module.css";

interface PipelineProgressProps {
  pipeline: JobPipelineProgress;
  steps: PipelineStep[];
  historyEntries: JobHistoryEntry[];
  /** Hide the inner "Pipeline: …" title when the parent supplies a panel header (job detail). */
  omitHeader?: boolean;
  /** No outer card chrome — use inside a parent panel (job detail). */
  flush?: boolean;
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
  historyEntries: JobHistoryEntry[],
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

  const overThreshold =
    step.maxDurationSeconds !== null &&
    actualSeconds !== null &&
    actualSeconds > step.maxDurationSeconds;

  const durationText =
    status === "upcoming"
      ? step.maxDurationSeconds !== null
        ? `~${formatDuration(step.maxDurationSeconds)}`
        : ""
      : actualSeconds !== null
        ? formatDuration(actualSeconds)
        : status === "current"
          ? "…"
          : "";

  return (
    <div className={styles.stepInner}>
      <div
        className={`${styles.ring} ${
          status === "completed"
            ? styles.ringCompleted
            : status === "current"
              ? styles.ringCurrent
              : ""
        }`}
      >
        {status === "completed" ? (
          <Check className={styles.checkIcon} size={12} strokeWidth={3} aria-hidden />
        ) : status === "current" ? (
          <span className={styles.pulse} />
        ) : null}
      </div>
      <p
        className={`${styles.stationLabel} ${status === "upcoming" ? styles.stationMuted : ""}`}
        title={step.stationName}
      >
        {step.stationName}
      </p>
      <p className={`${styles.durationLabel} ${overThreshold ? styles.durationWarn : ""}`}>
        {durationText}
      </p>
    </div>
  );
}

function Connector({ completed }: { completed: boolean }) {
  return <div className={`${styles.connector} ${completed ? styles.connectorDone : ""}`} />;
}

export function PipelineProgress({
  pipeline,
  steps,
  historyEntries,
  omitHeader = false,
  flush = false,
}: PipelineProgressProps) {
  const resolved = resolveStepStatuses(steps, pipeline.stepPosition, historyEntries);

  const remaining =
    pipeline.expectedSeconds !== null && pipeline.elapsedSeconds !== null
      ? pipeline.expectedSeconds - pipeline.elapsedSeconds
      : null;

  return (
    <div className={`${styles.root} ${flush ? styles.rootFlush : ""}`}>
      {!omitHeader && (
        <div className={styles.header}>
          <h3 className={styles.title}>Pipeline: {pipeline.name}</h3>
          {remaining !== null && (
            <span className={remaining < 0 ? styles.badgeLate : styles.badgeOk}>
              {remaining >= 0
                ? `${formatDuration(remaining)} remaining`
                : `Overdue by ${formatDuration(Math.abs(remaining))}`}
            </span>
          )}
        </div>
      )}

      {omitHeader && remaining !== null && (
        <div className={styles.inlineEta}>
          <span className={remaining < 0 ? styles.badgeLate : styles.badgeOk}>
            {remaining >= 0
              ? `${formatDuration(remaining)} remaining`
              : `Overdue by ${formatDuration(Math.abs(remaining))}`}
          </span>
        </div>
      )}

      <div className={styles.scroll}>
        <div className={styles.track}>
          {resolved.map((r, i) => (
            <div key={r.step.id} className={styles.stepColumn}>
              <StepNode resolved={r} />
              {i < resolved.length - 1 && <Connector completed={r.status === "completed"} />}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
