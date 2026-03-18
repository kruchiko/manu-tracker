import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "../../../shared/api/client";

export function useDeleteStation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (stationId: string) =>
      apiClient.deleteNoContent(`/stations/${stationId}`),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["stations"] });
    },
  });
}
