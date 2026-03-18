import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "../../../shared/api/client";
import type { Station } from "../stations.types";

export function useUnassignEye() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (stationId: string) =>
      apiClient.delete<Station>(`/stations/${stationId}/eye`),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["stations"] });
    },
  });
}
