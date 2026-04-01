import { useQuery } from "@tanstack/react-query";
import { apiClient } from "../../../shared/api/client";
import type { BoardJob } from "../dashboard.types";

export function useJobBoard() {
  return useQuery({
    queryKey: ["jobs", "board"],
    queryFn: () => apiClient.get<BoardJob[]>("/jobs/board"),
    staleTime: 0,
    refetchInterval: (query) => (query.state.error ? 30_000 : 1_000),
  });
}
