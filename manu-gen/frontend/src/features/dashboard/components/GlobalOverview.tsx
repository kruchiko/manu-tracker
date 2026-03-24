import { OrderBoard } from "./OrderBoard";
import { StationDurations } from "./StationDurations";
import { KpiCards } from "./KpiCards";
import { ActivitySparklines } from "./ActivitySparklines";
import type { BoardOrder } from "../dashboard.types";

interface GlobalOverviewProps {
  selectedOrderId: number | null;
  onSelectOrder: (order: BoardOrder) => void;
}

export function GlobalOverview({ selectedOrderId, onSelectOrder }: GlobalOverviewProps) {
  return (
    <>
      <KpiCards />

      <div className="flex flex-col rounded-lg border bg-white p-6 shadow-sm">
        <h3 className="mb-4 text-lg font-semibold">Live Order Board</h3>
        <OrderBoard
          selectedOrderId={selectedOrderId}
          onSelectOrder={onSelectOrder}
        />
      </div>

      <div className="mt-6 rounded-lg border bg-white p-6 shadow-sm">
        <h3 className="mb-4 text-lg font-semibold">Stage Duration Analytics</h3>
        <StationDurations />
      </div>

      <div className="mt-6 rounded-lg border bg-white p-6 shadow-sm">
        <h3 className="mb-4 text-lg font-semibold">Station Activity (24h)</h3>
        <ActivitySparklines />
      </div>
    </>
  );
}
