import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "../../../shared/api/client";
import type { CustomerOrder } from "../customer-orders.types";
import type { CreateCustomerOrderFormValues } from "../customer-orders.schema";

export function useCreateCustomerOrder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (values: CreateCustomerOrderFormValues) => {
      const body = {
        customerName: values.customerName,
        notes: values.notes || "",
        dueDate: values.dueDate || null,
        lines: values.lines,
      };
      return apiClient.post<CustomerOrder>("/customer-orders", body);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["customer-orders"] });
      void queryClient.invalidateQueries({ queryKey: ["jobs"] });
    },
  });
}
