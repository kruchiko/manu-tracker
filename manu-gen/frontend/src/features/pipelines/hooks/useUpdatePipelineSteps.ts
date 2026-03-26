import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "../../../shared/api/client";
import type { Pipeline } from "../pipelines.types";
import type { StepFormValue } from "../pipelines.schema";

interface UpdateStepsInput {
  pipelineId: string;
  steps: StepFormValue[];
}

export function useUpdatePipelineSteps() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ pipelineId, steps }: UpdateStepsInput) =>
      apiClient.put<Pipeline>(`/pipelines/${pipelineId}/steps`, { steps }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["pipelines"] });
    },
  });
}
