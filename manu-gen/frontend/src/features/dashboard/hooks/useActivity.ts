import { useQuery } from "@tanstack/react-query";
import { apiClient } from "../../../shared/api/client";
import type { StationActivity } from "../dashboard.types";

export function useActivity(enabled = true) {
  return useQuery({
    queryKey: ["analytics", "activity"],
    queryFn: () => apiClient.get<StationActivity[]>("/analytics/activity"),
    staleTime: 0,
    refetchInterval: enabled ? 60_000 : false,
    enabled,
  });
}
