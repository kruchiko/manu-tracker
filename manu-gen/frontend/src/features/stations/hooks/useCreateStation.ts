import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "../../../shared/api/client";
import type { Station } from "../stations.types";
import type { CreateStationFormValues } from "../stations.schema";
import { stationSchema } from "../stations.api-schema";

export function useCreateStation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateStationFormValues) =>
      apiClient.post<Station>("/stations", data, stationSchema),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["stations"] });
    },
  });
}
