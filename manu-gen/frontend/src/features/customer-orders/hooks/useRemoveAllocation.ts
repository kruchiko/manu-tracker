import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "../../../shared/api/client";

interface RemoveAllocationInput {
  jobId: number;
  allocationId: number;
}

export function useRemoveAllocation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ jobId, allocationId }: RemoveAllocationInput) =>
      apiClient.delete(`/jobs/${jobId}/allocations/${allocationId}`),
    onSuccess: (_data, variables) => {
      void queryClient.invalidateQueries({ queryKey: ["customer-orders"] });
      void queryClient.invalidateQueries({ queryKey: ["jobs"] });
      void queryClient.invalidateQueries({ queryKey: ["jobs", "detail", variables.jobId] });
    },
  });
}
