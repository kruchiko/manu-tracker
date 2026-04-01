import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { apiClient } from "../../../shared/api/client";
import type { JobHistoryEntry } from "../dashboard.types";

export function useJobHistory(jobId: number | null) {
  return useQuery({
    queryKey: ["jobs", jobId, "history"],
    queryFn: () => apiClient.get<JobHistoryEntry[]>(`/jobs/${jobId}/history`),
    enabled: jobId !== null,
    placeholderData: keepPreviousData,
    staleTime: 0,
    refetchInterval: (query) => (query.state.error ? 30_000 : 1_000),
  });
}
