import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "../../../shared/api/client";
import type { Pipeline } from "../pipelines.types";
import type { StepFormValue } from "../pipelines.schema";
import { serializePipelineStepsForApi } from "../pipelineSteps.apiPayload";

export interface SavePipelineInput {
  pipelineId: string;
  name: string;
  description: string;
  productType: string;
  steps: StepFormValue[];
}

export function useSavePipeline() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ pipelineId, name, description, productType, steps }: SavePipelineInput) =>
      apiClient.put<Pipeline>(`/pipelines/${pipelineId}`, {
        name,
        description,
        productType,
        steps: serializePipelineStepsForApi(steps),
      }),
    onSuccess: (_data, { pipelineId }) => {
      void queryClient.invalidateQueries({ queryKey: ["pipelines"] });
      void queryClient.invalidateQueries({ queryKey: ["pipelines", pipelineId] });
    },
  });
}
