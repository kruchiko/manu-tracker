import { useEffect, useRef } from "react";
import { useOrderBoard } from "../hooks/useOrderBoard";
import { OrderBoardRow } from "./OrderBoardRow";
import type { BoardOrder } from "../dashboard.types";

interface OrderBoardProps {
  selectedOrderId: number | null;
  onSelectOrder: (order: BoardOrder) => void;
}

export function OrderBoard({ selectedOrderId, onSelectOrder }: OrderBoardProps) {
  const { data, isLoading, error } = useOrderBoard();
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [data]);

  if (isLoading) {
    return <p className="text-sm text-gray-500">Loading order board...</p>;
  }

  if (error) {
    return <p className="text-sm text-red-600">Failed to load order board: {error.message}</p>;
  }

  const orders = data ?? [];

  if (orders.length === 0) {
    return <p className="text-sm text-gray-500">No orders yet.</p>;
  }

  return (
    <div ref={scrollRef} className="min-h-0 flex-1 overflow-auto" style={{ maxHeight: "200px" }}>
      <table className="w-full text-sm" role="grid">
        <thead className="sticky top-0 bg-white">
          <tr className="border-b text-left text-gray-500">
            <th className="py-2 pr-4 font-medium">Order</th>
            <th className="py-2 pr-4 font-medium">Customer</th>
            <th className="py-2 pr-4 font-medium">Product</th>
            <th className="py-2 pr-4 font-medium">Pipeline</th>
            <th className="py-2 pr-4 font-medium">Progress</th>
            <th className="py-2 pr-4 font-medium">Current Station</th>
            <th className="py-2 pr-4 font-medium">Time at Station</th>
            <th className="py-2 font-medium">Last Seen</th>
          </tr>
        </thead>
        <tbody>
          {orders.map((order) => (
            <OrderBoardRow
              key={order.id}
              order={order}
              isSelected={selectedOrderId === order.id}
              onSelect={onSelectOrder}
            />
          ))}
        </tbody>
      </table>
    </div>
  );
}
