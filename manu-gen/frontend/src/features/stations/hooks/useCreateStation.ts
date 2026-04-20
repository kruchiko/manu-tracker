import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "../../../shared/api/client";
import type { Station } from "../stations.types";
import type { CreateStationRequestBody } from "../stations.schema";
import { stationSchema } from "../stations.api-schema";

function createStationJsonBody(data: CreateStationRequestBody): Record<string, unknown> {
  const body: Record<string, unknown> = { name: data.name };
  if (data.location !== undefined) {
    body.location = data.location ?? "";
  }
  if (data.slotCapacity !== undefined) {
    body.slotCapacity = data.slotCapacity;
  }
  return body;
}

export function useCreateStation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateStationRequestBody) =>
      apiClient.post<Station>("/stations", createStationJsonBody(data), stationSchema),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["stations"] });
    },
  });
}
