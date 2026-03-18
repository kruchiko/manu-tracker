import { useQuery } from "@tanstack/react-query";
import { apiClient } from "../../../shared/api/client";
import type { BoardOrder } from "../dashboard.types";

export function useOrderBoard() {
  return useQuery({
    queryKey: ["orders", "board"],
    queryFn: () => apiClient.get<BoardOrder[]>("/orders/board"),
    refetchInterval: (query) => (query.state.error ? 30_000 : 5_000),
  });
}
