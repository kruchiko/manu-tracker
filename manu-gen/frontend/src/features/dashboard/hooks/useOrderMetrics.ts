import { useQuery } from "@tanstack/react-query";
import { apiClient } from "../../../shared/api/client";

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
  byProductType: ProductTypeMetric[];
}

export function useOrderMetrics() {
  return useQuery<OrderMetrics>({
    queryKey: ["analytics", "order-metrics"],
    queryFn: () => apiClient.get<OrderMetrics>("/analytics/order-metrics"),
    refetchInterval: 10_000,
  });
}
