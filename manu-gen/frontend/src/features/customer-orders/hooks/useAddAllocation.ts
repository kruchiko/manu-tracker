import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "../../../shared/api/client";
import type { LineAllocation } from "../customer-orders.types";

interface AddAllocationInput {
  jobId: number;
  orderLineId: number;
  quantity: number;
}

export function useAddAllocation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ jobId, orderLineId, quantity }: AddAllocationInput) =>
      apiClient.post<LineAllocation>(`/jobs/${jobId}/allocations`, {
        orderLineId,
        quantity,
      }),
    onSuccess: (_data, variables) => {
      void queryClient.invalidateQueries({ queryKey: ["customer-orders"] });
      void queryClient.invalidateQueries({ queryKey: ["jobs"] });
      void queryClient.invalidateQueries({ queryKey: ["jobs", "detail", variables.jobId] });
    },
  });
}
