import { useEffect, useState } from "react";
import type { BoardJob, BoardJobPipeline, JobStatus } from "../dashboard.types";
import { formatDuration, parseUtc } from "../dashboard.utils";
import styles from "./JobBoardRow.module.css";

const STATUS_LABEL: Record<JobStatus, string> = {
  pending: "Pending",
  in_progress: "In Progress",
  completed: "Completed",
};

const STATUS_STYLE: Record<JobStatus, string> = {
  pending: styles.badgePending,
  in_progress: styles.badgeInProgress,
  completed: styles.badgeCompleted,
};

interface JobBoardRowProps {
  job: BoardJob;
  onSelect: (job: BoardJob) => void;
}

function formatLastSeen(iso: string): string {
  const date = parseUtc(iso);
  const now = new Date();
  const isToday = date.toDateString() === now.toDateString();
  const time = date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  return isToday ? `${time} today` : date.toLocaleDateString([], { month: "short", day: "numeric" }) + ` ${time}`;
}

function durationClass(seconds: number | null, threshold: number | null): string {
  if (seconds === null) return styles.durationNeutral;
  if (threshold !== null) {
    if (seconds >= threshold) return styles.durationDanger;
    if (seconds >= threshold * 0.75) return styles.durationWarn;
    return styles.durationOk;
  }
  if (seconds < 3600) return styles.durationOk;
  if (seconds < 14400) return styles.durationWarn;
  return styles.durationDanger;
}

function progressFillClass(pipeline: BoardJobPipeline): string {
  if (pipeline.expectedSeconds === null || pipeline.elapsedSeconds === null)
    return styles.progressFillDefault;
  const ratio = pipeline.elapsedSeconds / pipeline.expectedSeconds;
  if (ratio >= 1) return styles.progressFillDanger;
  if (ratio >= 0.75) return styles.progressFillWarn;
  return styles.progressFillOk;
}

function useLiveDuration(arrivedAt: string | null, active: boolean): number | null {
  const [now, setNow] = useState(Date.now);

  useEffect(() => {
    if (!active || !arrivedAt) return;
    const id = setInterval(() => setNow(Date.now()), 1_000);
    return () => clearInterval(id);
  }, [active, arrivedAt]);

  if (!active || !arrivedAt) return null;
  return Math.max(0, Math.floor((now - parseUtc(arrivedAt).getTime()) / 1000));
}

function PipelineProgressBar({ pipeline }: { pipeline: BoardJobPipeline }) {
  const fillClass = progressFillClass(pipeline);
  const completedFraction = pipeline.stepPosition / pipeline.totalSteps;

  return (
    <div className={styles.progressRow}>
      <div className={styles.progressTrack}>
        <div
          className={`${styles.progressFill} ${fillClass}`}
          style={{ width: `${Math.min(100, completedFraction * 100)}%` }}
        />
      </div>
      <span className={styles.progressLabel}>
        {pipeline.stepPosition}/{pipeline.totalSteps}
      </span>
      {pipeline.expectedSeconds !== null && pipeline.elapsedSeconds !== null && (
        <span className={styles.progressElapsed}>
          {formatDuration(pipeline.elapsedSeconds)}/{formatDuration(pipeline.expectedSeconds)}
        </span>
      )}
    </div>
  );
}

export function JobBoardRow({ job, onSelect }: JobBoardRowProps) {
  const durationSeconds = useLiveDuration(job.stationArrivedAt, job.currentStation !== null);
  const durClass = durationClass(durationSeconds, job.maxDurationSeconds);

  return (
    <tr
      onClick={() => onSelect(job)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onSelect(job);
        }
      }}
      tabIndex={0}
      className={styles.row}
    >
      <td className={`${styles.td} ${styles.mono}`}>{job.jobNumber}</td>
      <td className={styles.td}>{job.productType}</td>
      <td className={styles.td}>
        <span className={`${styles.badge} ${STATUS_STYLE[job.status]}`}>
          {STATUS_LABEL[job.status]}
        </span>
      </td>
      <td className={styles.td}>
        <span className={styles.pipelineName}>{job.pipeline.name}</span>
      </td>
      <td className={styles.td}>
        <PipelineProgressBar pipeline={job.pipeline} />
      </td>
      <td className={styles.td}>
        {job.currentStation ? job.currentStation.name : (
          <span className={styles.mutedItalic}>(not yet seen)</span>
        )}
      </td>
      <td className={styles.td}>
        {durationSeconds !== null ? (
          <span className={durClass}>{formatDuration(durationSeconds)}</span>
        ) : (
          <span className={styles.muted}>--</span>
        )}
      </td>
      <td className={`${styles.td} ${styles.tdLast}`}>
        {job.lastSeenAt ? formatLastSeen(job.lastSeenAt) : (
          <span className={styles.muted}>--</span>
        )}
      </td>
    </tr>
  );
}
