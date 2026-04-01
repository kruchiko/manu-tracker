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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["customer-orders"] });
      queryClient.invalidateQueries({ queryKey: ["jobs"] });
    },
  });
}
