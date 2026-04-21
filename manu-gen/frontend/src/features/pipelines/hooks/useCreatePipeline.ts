import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "../../../shared/api/client";
import type { Pipeline } from "../pipelines.types";
import type { CreatePipelineFormValues } from "../pipelines.schema";
import { serializePipelineStepsForApi } from "../pipelineSteps.apiPayload";

export function useCreatePipeline() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreatePipelineFormValues) =>
      apiClient.post<Pipeline>("/pipelines", {
        ...data,
        steps: serializePipelineStepsForApi(data.steps),
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["pipelines"] });
    },
  });
}
