import { useQuery } from "@tanstack/react-query";
import { apiClient } from "../api/client";

export interface ProductTypeMetric {
  productType: string;
  totalQuantity: number;
  fulfilledQuantity: number;
  jobCount: number;
}

export interface OrderMetrics {
  totalOrders: number;
  fulfilledOrders: number;
  avgJobsPerOrder: number;
  /** Drop when backend removes it (GitHub issue #38). */
  byProductType: ProductTypeMetric[];
}

export function useOrderMetrics(options?: { enabled?: boolean }) {
  return useQuery<OrderMetrics>({
    queryKey: ["analytics", "order-metrics"],
    queryFn: () => apiClient.get<OrderMetrics>("/analytics/order-metrics"),
    refetchInterval: 10_000,
    enabled: options?.enabled ?? true,
  });
}
