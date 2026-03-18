import { useState } from "react";
import { OrderBoard } from "./OrderBoard";
import { OrderHistory } from "./OrderHistory";
import { StationDurations } from "./StationDurations";
import { useOrderBoard } from "../hooks/useOrderBoard";

export function DashboardPage() {
  const [selectedOrderId, setSelectedOrderId] = useState<number | null>(null);
  const { data: orders } = useOrderBoard();
  const selectedOrder = orders?.find((o) => o.id === selectedOrderId) ?? null;

  return (
    <div className="mx-auto max-w-6xl">
      <h2 className="mb-6 text-xl font-semibold text-gray-900">Dashboard</h2>

      <div className={`mb-8 grid gap-6 ${selectedOrder ? "lg:grid-cols-[1fr_20rem]" : ""}`}>
        <div className="flex flex-col rounded-lg border bg-white p-6 shadow-sm">
          <h3 className="mb-4 text-lg font-semibold">Live Order Board</h3>
          <OrderBoard
            selectedOrderId={selectedOrderId}
            onSelectOrder={(order) => setSelectedOrderId(order.id)}
          />
        </div>

        {selectedOrder && (
          <OrderHistory
            order={selectedOrder}
            onClose={() => setSelectedOrderId(null)}
          />
        )}
      </div>

      <div className="rounded-lg border bg-white p-6 shadow-sm">
        <h3 className="mb-4 text-lg font-semibold">Stage Duration Analytics</h3>
        <StationDurations />
      </div>
    </div>
  );
}
