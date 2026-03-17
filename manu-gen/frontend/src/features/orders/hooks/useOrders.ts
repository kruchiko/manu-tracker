import { useQuery } from "@tanstack/react-query";
import { apiClient } from "../../../shared/api/client";
import type { OrdersResponse } from "../orders.types";

interface UseOrdersOptions {
  limit?: number;
  offset?: number;
}

export function useOrders({ limit = 100, offset = 0 }: UseOrdersOptions = {}) {
  return useQuery({
    queryKey: ["orders", { limit, offset }],
    queryFn: () =>
      apiClient.get<OrdersResponse>(`/orders?limit=${limit}&offset=${offset}`),
  });
}
