import { useQuery, skipToken } from "@tanstack/react-query";
import { apiClient } from "../../../shared/api/client";
import type { QrCodeResponse } from "../jobs.types";

export function useQrCode(jobId: number | null) {
  return useQuery({
    queryKey: ["jobs", { id: jobId, type: "qr" }],
    queryFn:
      jobId !== null
        ? () => apiClient.get<QrCodeResponse>(`/jobs/${jobId}/qr?format=dataurl`)
        : skipToken,
  });
}
