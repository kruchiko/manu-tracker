import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "../../../shared/api/client";
import type { Station } from "../stations.types";

interface UpdateStationInput {
  stationId: string;
  maxDurationSeconds: number | null;
}

export function useUpdateStation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ stationId, maxDurationSeconds }: UpdateStationInput) =>
      apiClient.patch<Station>(`/stations/${stationId}`, { maxDurationSeconds }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["stations"] });
      queryClient.invalidateQueries({ queryKey: ["analytics"] });
    },
  });
}
