import type { JobHistoryEntry, JobHistoryPhase, JobPipelineProgress } from "../jobs/jobs.types";

export type BoardJobPipeline = JobPipelineProgress;

export type { JobHistoryEntry, JobHistoryPhase };

export type JobStatus = "pending" | "in_progress" | "completed";

export interface BoardJob {
  id: number;
  jobNumber: string;
  productType: string;
  trayCode: string;
  createdAt: string;
  status: JobStatus;
  currentStation: { id: string; name: string } | null;
  lastSeenAt: string | null;
  stationArrivedAt: string | null;
  maxDurationSeconds: number | null;
  pipeline: JobPipelineProgress;
}

export interface HourlyBucket {
  hour: string;
  count: number;
}

export interface StationActivity {
  stationId: string;
  stationName: string;
  buckets: HourlyBucket[];
}

export interface DashboardSummary {
  activeJobs: number;
  totalTrackedJobs: number;
  avgDwellSeconds: number;
  bottleneckStation: string | null;
  thresholdViolations: number;
}

export interface StationDuration {
  stationId: string;
  stationName: string;
  avgSeconds: number;
  maxSeconds: number;
  minSeconds: number;
  medianSeconds: number;
  p95Seconds: number;
  jobCount: number;
}
