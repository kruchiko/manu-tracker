export interface PipelineStep {
  id: number;
  stationId: string;
  stationName: string;
  position: number;
  maxDurationSeconds: number | null;
  maxCapacity: number | null;
}

export interface Pipeline {
  id: string;
  name: string;
  description: string;
  productType: string;
  createdAt: string;
  steps: PipelineStep[];
  totalExpectedSeconds: number | null;
  effectiveCapacity: number | null;
}
