import type { JobStatus } from "../jobs.types";
import { JOB_STATUS_LABEL } from "./jobStatusLabels";
import styles from "./JobStatusBadge.module.css";

function statusClass(status: JobStatus): string {
  if (status === "pending") return styles.pending;
  if (status === "in_progress") return styles.inProgress;
  return styles.completed;
}

interface JobStatusBadgeProps {
  status: JobStatus;
}

export function JobStatusBadge({ status }: JobStatusBadgeProps) {
  return (
    <span className={`${styles.badge} ${statusClass(status)}`}>
      {JOB_STATUS_LABEL[status]}
    </span>
  );
}
