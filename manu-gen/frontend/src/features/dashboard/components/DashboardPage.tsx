import { useState, useRef, useEffect } from "react";
import { GlobalOverview } from "./GlobalOverview";
import { OrderDetailView } from "./OrderDetailView";
import { useOrderBoard } from "../hooks/useOrderBoard";
import { OverviewVisibleContext } from "../OverviewVisibleContext";

export function DashboardPage() {
  const [selectedOrderId, setSelectedOrderId] = useState<number | null>(null);
  const { data: orders } = useOrderBoard();
  const selectedOrder = orders?.find((o) => o.id === selectedOrderId) ?? null;
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    containerRef.current?.scrollTo({ top: 0 });
  }, [selectedOrderId]);

  const drilled = selectedOrder !== null;

  return (
    <div ref={containerRef} className="overflow-hidden">
      <h2 className="mb-6 text-xl font-semibold text-gray-900">Dashboard</h2>

      <div className="relative">
        <div
          className="flex transition-transform duration-300 ease-in-out"
          style={{ transform: drilled ? "translateX(-100%)" : "translateX(0)" }}
        >
          {/* Panel 1: Global Overview */}
          <div className="w-full shrink-0">
            <OverviewVisibleContext.Provider value={!drilled}>
              <GlobalOverview
                selectedOrderId={selectedOrderId}
                onSelectOrder={(order) => setSelectedOrderId(order.id)}
              />
            </OverviewVisibleContext.Provider>
          </div>

          {/* Panel 2: Order Detail */}
          <div className="w-full shrink-0">
            {selectedOrder && (
              <OrderDetailView
                order={selectedOrder}
                onBack={() => setSelectedOrderId(null)}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
