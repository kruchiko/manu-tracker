import type { JobStatus } from "../jobs.types";

/** Tab labels, table emphasis, and filtered-empty headlines — single source for status wording. */
export const JOB_STATUS_LABEL: Record<JobStatus, string> = {
  pending: "Pending",
  in_progress: "In Progress",
  completed: "Completed",
};

/**
 * Segment order for the Jobs list filter (the "All" tab is prepended in `JobsListView`).
 * Typed as a tuple so TypeScript errors if a status is missing or duplicated.
 */
export const JOB_STATUS_FILTER_ORDER: readonly [
  "pending",
  "in_progress",
  "completed",
] = ["pending", "in_progress", "completed"];

/** e.g. "No Pending jobs", "No In Progress jobs" — matches tab labels in `JOB_STATUS_LABEL`. */
export function filteredEmptyHeadline(status: JobStatus): string {
  return `No ${JOB_STATUS_LABEL[status]} jobs`;
}
