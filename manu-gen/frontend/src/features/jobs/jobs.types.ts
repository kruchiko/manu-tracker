export type JobStatus = "pending" | "in_progress" | "completed";

/** Pipeline timing block — same shape as board jobs (`GET /jobs/board`, `GET /jobs/:id`). */
export interface JobPipelineProgress {
  id: string;
  name: string;
  stepPosition: number;
  totalSteps: number;
  expectedSeconds: number | null;
  elapsedSeconds: number | null;
}

/** One row from `GET /jobs/:id` `allocations` (and `POST` allocation response). */
export interface JobAllocation {
  id: number;
  orderLineId: number;
  jobId: number;
  quantity: number;
  orderNumber: string;
  customerName: string;
  productType: string;
  customerOrderId: number;
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
  /** Present on `GET /jobs/:id` and `GET /jobs/tray/:trayCode` (GitHub #28). */
  pipeline?: JobPipelineProgress;
  /** Present on single-job GET — links to customer orders (GitHub #35). */
  allocations?: JobAllocation[];
  /** Units still assignable to order lines (`quantity - allocatedQuantity`); single-job GET only. */
  availableToAllocate?: number;
}

export type JobsResponse = Job[];

export interface QrCodeResponse {
  qr: string;
}

export type JobHistoryPhase = "arrived" | "departed" | "scan";

export interface JobHistoryEntry {
  id: number;
  phase: JobHistoryPhase;
  /** Station id — stable key for timeline chrome (GitHub #29). */
  stationId: string;
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
