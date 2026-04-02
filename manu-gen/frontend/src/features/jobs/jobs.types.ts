export type JobStatus = "pending" | "in_progress" | "completed";

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
}

export type JobsResponse = Job[];

export interface QrCodeResponse {
  qr: string;
}
