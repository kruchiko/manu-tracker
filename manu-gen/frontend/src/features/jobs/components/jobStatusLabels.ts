import type { JobStatus } from "../jobs.types";

export const JOB_STATUS_LABEL: Record<JobStatus, string> = {
  pending: "Pending",
  in_progress: "In Progress",
  completed: "Completed",
};
