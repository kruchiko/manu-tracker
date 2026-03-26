import { useQuery } from "@tanstack/react-query";
import { apiClient } from "../../../shared/api/client";
import type { Pipeline } from "../pipelines.types";

export function usePipeline(pipelineId: string | null) {
  return useQuery({
    queryKey: ["pipelines", pipelineId],
    queryFn: () => apiClient.get<Pipeline>(`/pipelines/${pipelineId}`),
    enabled: pipelineId !== null,
  });
}
