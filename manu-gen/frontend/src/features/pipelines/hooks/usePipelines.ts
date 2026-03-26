import { useQuery } from "@tanstack/react-query";
import { apiClient } from "../../../shared/api/client";
import type { Pipeline } from "../pipelines.types";

export function usePipelines() {
  return useQuery({
    queryKey: ["pipelines"],
    queryFn: () => apiClient.get<Pipeline[]>("/pipelines?limit=100"),
  });
}
