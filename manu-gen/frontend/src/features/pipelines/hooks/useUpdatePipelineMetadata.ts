import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "../../../shared/api/client";
import type { Pipeline } from "../pipelines.types";

export interface UpdatePipelineMetadataBody {
  name: string;
  productType: string;
  description: string;
}

interface UpdatePipelineMetadataInput {
  pipelineId: string;
  body: UpdatePipelineMetadataBody;
}

export function useUpdatePipelineMetadata() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ pipelineId, body }: UpdatePipelineMetadataInput) =>
      apiClient.patch<Pipeline>(`/pipelines/${pipelineId}`, body),
    onSuccess: (_data, { pipelineId }) => {
      void queryClient.invalidateQueries({ queryKey: ["pipelines"] });
      void queryClient.invalidateQueries({ queryKey: ["pipelines", pipelineId] });
    },
  });
}
