import { useQuery } from "@tanstack/react-query";
import { apiClient } from "../../../shared/api/client";
import type { JobsResponse } from "../jobs.types";

interface UseJobsOptions {
  limit?: number;
  offset?: number;
}

export function useJobs({ limit = 100, offset = 0 }: UseJobsOptions = {}) {
  return useQuery({
    queryKey: ["jobs", { limit, offset }],
    queryFn: () =>
      apiClient.get<JobsResponse>(`/jobs?limit=${limit}&offset=${offset}`),
  });
}
