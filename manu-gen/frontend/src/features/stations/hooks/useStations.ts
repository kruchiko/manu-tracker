import { useQuery } from "@tanstack/react-query";
import { apiClient } from "../../../shared/api/client";
import type { Station } from "../stations.types";

export function useStations() {
  return useQuery({
    queryKey: ["stations"],
    queryFn: () => apiClient.get<Station[]>("/stations?limit=100"),
  });
}
