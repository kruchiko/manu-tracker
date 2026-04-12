import type { Job, JobStatus } from "../jobs.types";

export type JobsTableFilter = "all" | JobStatus;

export function filterJobsByTab(jobs: Job[], filter: JobsTableFilter): Job[] {
  if (filter === "all") return jobs;
  return jobs.filter((j) => j.status === filter);
}
