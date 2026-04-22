import { Fragment } from "react";
import { Check } from "lucide-react";
import type { PipelineStep } from "../../pipelines/pipelines.types";
import type { JobHistoryEntry, JobPipelineProgress } from "../jobs.types";
import { formatDuration } from "../utils/duration";
import { resolveStepStatuses, type ResolvedPipelineStep } from "./pipelineProgress.utils";
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

function StepNode({ resolved }: { resolved: ResolvedPipelineStep }) {
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
              : styles.ringPending
        }`}
      >
        {status === "completed" ? (
          <Check className={styles.checkIcon} size={12} strokeWidth={3} aria-hidden />
        ) : status === "current" ? (
          <span className={styles.pulse} />
        ) : null}
      </div>
      <p
        className={`${styles.stationLabel} ${
          status === "completed"
            ? styles.stationLabelDone
            : status === "current"
              ? styles.stationLabelActive
              : styles.stationLabelPending
        }`}
        title={step.stationName}
      >
        {step.stationName}
      </p>
      <p
        className={`${styles.durationLabel} ${
          overThreshold
            ? styles.durationWarn
            : status === "current"
              ? styles.durationLabelActive
              : ""
        }`}
      >
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
            <Fragment key={r.step.id}>
              <div className={styles.stepColumn}>
                <StepNode resolved={r} />
              </div>
              {i < resolved.length - 1 && <Connector completed={r.status === "completed"} />}
            </Fragment>
          ))}
        </div>
      </div>
    </div>
  );
}
