import { useQuery, skipToken } from "@tanstack/react-query";
import { apiClient } from "../../../shared/api/client";
import type { CustomerOrder } from "../customer-orders.types";

export function useCustomerOrder(id: number | null) {
  return useQuery({
    queryKey: ["customer-orders", id],
    queryFn: id !== null
      ? () => apiClient.get<CustomerOrder>(`/customer-orders/${id}`)
      : skipToken,
  });
}
