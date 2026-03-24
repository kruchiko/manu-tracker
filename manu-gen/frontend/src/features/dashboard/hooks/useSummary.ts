import { useQuery } from "@tanstack/react-query";
import { apiClient } from "../../../shared/api/client";
import type { DashboardSummary } from "../dashboard.types";

export function useSummary(enabled = true) {
  return useQuery({
    queryKey: ["analytics", "summary"],
    queryFn: () => apiClient.get<DashboardSummary>("/analytics/summary"),
    staleTime: 0,
    refetchInterval: enabled ? 15_000 : false,
    enabled,
  });
}
