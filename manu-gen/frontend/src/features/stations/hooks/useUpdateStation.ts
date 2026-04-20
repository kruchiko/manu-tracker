import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "../../../shared/api/client";
import type { Station } from "../stations.types";
import { stationSchema } from "../stations.api-schema";

export interface UpdateStationPayload {
  id: string;
  name: string;
  location?: string;
  slotCapacity?: number;
}

export function useUpdateStation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, name, location, slotCapacity }: UpdateStationPayload) =>
      apiClient.put<Station>(
        `/stations/${id}`,
        {
          name,
          location: location ?? "",
          ...(slotCapacity !== undefined ? { slotCapacity } : {}),
        },
        stationSchema,
      ),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["stations"] });
    },
  });
}
