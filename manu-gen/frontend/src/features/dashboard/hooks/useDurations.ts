import { useQuery } from "@tanstack/react-query";
import { apiClient } from "../../../shared/api/client";
import type { StationDuration } from "../dashboard.types";

export function useDurations() {
  return useQuery({
    queryKey: ["analytics", "durations"],
    queryFn: () => apiClient.get<StationDuration[]>("/analytics/durations"),
    refetchInterval: 30_000,
  });
}
