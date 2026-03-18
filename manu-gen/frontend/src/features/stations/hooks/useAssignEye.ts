import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "../../../shared/api/client";
import type { Station } from "../stations.types";

export function useAssignEye() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ stationId, eyeId }: { stationId: string; eyeId: string }) =>
      apiClient.put<Station>(`/stations/${stationId}/eye`, { eyeId }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["stations"] });
    },
  });
}
