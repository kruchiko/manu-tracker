import { useQuery } from "@tanstack/react-query";
import { apiClient } from "../../../shared/api/client";
import type { Job } from "../jobs.types";

interface UseJobOptions {
  enabled?: boolean;
  placeholderData?: Job;
}

export function useJob(jobId: number | null, options?: UseJobOptions) {
  return useQuery({
    queryKey: ["jobs", "detail", jobId],
    queryFn: () => apiClient.get<Job>(`/jobs/${jobId!}`),
    enabled: (options?.enabled ?? true) && jobId != null,
    placeholderData: options?.placeholderData,
  });
}
