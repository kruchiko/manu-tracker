import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "../../../shared/api/client";
import type { Station } from "../stations.types";
import { stationSchema } from "../stations.api-schema";

export interface UpdateStationPayload {
  id: string;
  name: string;
  location?: string;
}

export function useUpdateStation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, name, location }: UpdateStationPayload) =>
      apiClient.put<Station>(
        `/stations/${id}`,
        { name, location: location ?? "" },
        stationSchema,
      ),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["stations"] });
    },
  });
}
