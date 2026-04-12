export type JobStatus = "pending" | "in_progress" | "completed";

/** Pipeline timing block — same shape as board jobs; optional on GET /jobs/:id until API is enriched (see GitHub #28). */
export interface JobPipelineProgress {
  id: string;
  name: string;
  stepPosition: number;
  totalSteps: number;
  expectedSeconds: number | null;
  elapsedSeconds: number | null;
}

export interface Job {
  id: number;
  jobNumber: string;
  productType: string;
  quantity: number;
  allocatedQuantity: number;
  notes: string;
  trayCode: string;
  createdAt: string;
  pipelineId: string;
  pipelineName: string;
  status: JobStatus;
  /** Present when backend exposes pipeline progress on single-job responses. */
  pipeline?: JobPipelineProgress;
}

export type JobsResponse = Job[];

export interface QrCodeResponse {
  qr: string;
}

export type JobHistoryPhase = "arrived" | "departed" | "scan";

export interface JobHistoryEntry {
  id: number;
  phase: JobHistoryPhase;
  station: string;
  at: string;
  durationSeconds: number | null;
}

/** Minimal job fields for timeline chrome (embedded mode). */
export interface JobTimelineContext {
  id: number;
  jobNumber: string;
  productType: string;
  trayCode: string;
}
