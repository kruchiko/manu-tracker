export interface BoardJobPipeline {
  id: string;
  name: string;
  stepPosition: number;
  totalSteps: number;
  expectedSeconds: number | null;
  elapsedSeconds: number | null;
}

export interface BoardJob {
  id: number;
  jobNumber: string;
  productType: string;
  trayCode: string;
  createdAt: string;
  currentStation: { id: string; name: string } | null;
  lastSeenAt: string | null;
  stationArrivedAt: string | null;
  maxDurationSeconds: number | null;
  pipeline: BoardJobPipeline;
}

export type JobHistoryPhase = "arrived" | "departed" | "scan";

export interface JobHistoryEntry {
  id: number;
  phase: JobHistoryPhase;
  station: string;
  at: string;
  durationSeconds: number | null;
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
