import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "../../../shared/api/client";
import type { Station } from "../stations.types";
import { stationSchema } from "../stations.api-schema";

export function useUnassignEye() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (stationId: string) =>
      apiClient.delete<Station>(`/stations/${stationId}/eye`, stationSchema),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["stations"] });
    },
  });
}
