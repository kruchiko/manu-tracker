import { useQuery } from "@tanstack/react-query";
import { apiClient } from "../../../shared/api/client";
import type { CustomerOrderSummary } from "../customer-orders.types";

export function useCustomerOrders() {
  return useQuery({
    queryKey: ["customer-orders"],
    queryFn: () => apiClient.get<CustomerOrderSummary[]>("/customer-orders?limit=100"),
  });
}
