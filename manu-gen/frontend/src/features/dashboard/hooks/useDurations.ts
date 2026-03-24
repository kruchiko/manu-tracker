import { useQuery } from "@tanstack/react-query";
import { apiClient } from "../../../shared/api/client";
import type { StationDuration } from "../dashboard.types";

export function useDurations(enabled = true) {
  return useQuery({
    queryKey: ["analytics", "durations"],
    queryFn: () => apiClient.get<StationDuration[]>("/analytics/durations"),
    staleTime: 0,
    refetchInterval: enabled ? 15_000 : false,
    enabled,
  });
}
