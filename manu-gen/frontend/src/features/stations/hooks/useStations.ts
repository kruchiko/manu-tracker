import { useQuery } from "@tanstack/react-query";
import { apiClient } from "../../../shared/api/client";
import type { Station } from "../stations.types";
import { stationListSchema } from "../stations.api-schema";

export function useStations() {
  return useQuery({
    queryKey: ["stations"],
    queryFn: () => apiClient.get<Station[]>("/stations?limit=100", stationListSchema),
  });
}
