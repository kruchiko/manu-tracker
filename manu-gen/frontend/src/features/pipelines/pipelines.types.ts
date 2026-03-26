export interface PipelineStep {
  id: number;
  stationId: string;
  stationName: string;
  position: number;
  maxDurationSeconds: number | null;
}

export interface Pipeline {
  id: string;
  name: string;
  description: string;
  createdAt: string;
  steps: PipelineStep[];
  totalExpectedSeconds: number | null;
}
