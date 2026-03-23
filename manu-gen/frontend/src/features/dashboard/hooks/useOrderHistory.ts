import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { apiClient } from "../../../shared/api/client";
import type { OrderHistoryEntry } from "../dashboard.types";

export function useOrderHistory(orderId: number | null) {
  return useQuery({
    queryKey: ["orders", orderId, "history"],
    queryFn: () => apiClient.get<OrderHistoryEntry[]>(`/orders/${orderId}/history`),
    enabled: orderId !== null,
    placeholderData: keepPreviousData,
    staleTime: 0,
    refetchInterval: (query) => (query.state.error ? 30_000 : 1_000),
  });
}
