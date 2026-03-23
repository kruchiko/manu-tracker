import { useQuery } from "@tanstack/react-query";
import { apiClient } from "../../../shared/api/client";
import type { BoardOrder } from "../dashboard.types";

export function useOrderBoard() {
  return useQuery({
    queryKey: ["orders", "board"],
    queryFn: () => apiClient.get<BoardOrder[]>("/orders/board"),
    /** Must be 0: global defaultQueries staleTime (60s) would otherwise throttle interval refetches. */
    staleTime: 0,
    refetchInterval: (query) => (query.state.error ? 30_000 : 1_000),
  });
}
