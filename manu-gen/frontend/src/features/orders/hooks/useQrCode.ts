import { useQuery, skipToken } from "@tanstack/react-query";
import { apiClient } from "../../../shared/api/client";
import type { QrCodeResponse } from "../orders.types";

export function useQrCode(orderId: number | null) {
  return useQuery({
    queryKey: ["orders", { id: orderId, type: "qr" }],
    queryFn:
      orderId !== null
        ? () => apiClient.get<QrCodeResponse>(`/orders/${orderId}/qr?format=dataurl`)
        : skipToken,
  });
}
