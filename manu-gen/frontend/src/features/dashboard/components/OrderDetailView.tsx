import { useOrderHistory } from "../hooks/useOrderHistory";
import { OrderJourneyChart } from "./OrderJourneyChart";
import { OrderHistory } from "./OrderHistory";
import type { BoardOrder, OrderHistoryEntry } from "../dashboard.types";
import { formatDuration } from "../dashboard.utils";

interface OrderDetailViewProps {
  order: BoardOrder;
  onBack: () => void;
}

interface JourneyStats {
  totalTrackedSeconds: number;
  stationVisits: number;
  longestDwellSeconds: number;
  longestDwellStation: string;
}

function computeStats(entries: OrderHistoryEntry[]): JourneyStats {
  let totalTrackedSeconds = 0;
  let longestDwellSeconds = 0;
  let longestDwellStation = "";
  let stationVisits = 0;

  for (const entry of entries) {
    if (entry.durationSeconds === null || entry.durationSeconds <= 0) continue;

    if (entry.phase === "departed" || entry.phase === "scan") {
      totalTrackedSeconds += entry.durationSeconds;
      stationVisits++;
      if (entry.durationSeconds > longestDwellSeconds) {
        longestDwellSeconds = entry.durationSeconds;
        longestDwellStation = entry.station;
      }
    }
  }

  return { totalTrackedSeconds, stationVisits, longestDwellSeconds, longestDwellStation };
}

function StatCard({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="rounded-lg border bg-gray-50 px-4 py-3">
      <p className="text-xs font-medium uppercase tracking-wide text-gray-500">{label}</p>
      <p className="mt-1 text-lg font-semibold text-gray-900">{value}</p>
      {sub && <p className="text-xs text-gray-400">{sub}</p>}
    </div>
  );
}

export function OrderDetailView({ order, onBack }: OrderDetailViewProps) {
  const { data, isLoading, error } = useOrderHistory(order.id);
  const entries = data ?? [];
  const stats = computeStats(entries);

  return (
    <div className="mx-auto max-w-6xl">
      <button
        type="button"
        onClick={onBack}
        className="mb-4 inline-flex items-center gap-1 rounded-md px-2 py-1 text-sm font-medium text-gray-600 hover:bg-gray-100 hover:text-gray-900"
      >
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
        </svg>
        Back to overview
      </button>

      <div className="mb-6">
        <h2 className="text-xl font-semibold text-gray-900">
          {order.orderNumber} — {order.customerName}
        </h2>
        <p className="text-sm text-gray-500">{order.productType}</p>
      </div>

      {isLoading && <p className="text-sm text-gray-500">Loading order details...</p>}
      {error && <p className="text-sm text-red-600">Failed to load order details: {error.message}</p>}

      {!isLoading && !error && (
        <>
          <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
            <StatCard
              label="Total tracked time"
              value={stats.totalTrackedSeconds > 0 ? formatDuration(stats.totalTrackedSeconds) : "--"}
            />
            <StatCard
              label="Station visits"
              value={stats.stationVisits > 0 ? String(stats.stationVisits) : "--"}
            />
            <StatCard
              label="Longest dwell"
              value={stats.longestDwellSeconds > 0 ? formatDuration(stats.longestDwellSeconds) : "--"}
              sub={stats.longestDwellStation || undefined}
            />
          </div>

          {entries.length > 0 && (
            <div className="mb-6 rounded-lg border bg-white p-6 shadow-sm">
              <h3 className="mb-4 text-lg font-semibold">Time Distribution by Station</h3>
              <OrderJourneyChart entries={entries} />
            </div>
          )}

          <div className="rounded-lg border bg-white p-6 shadow-sm">
            <h3 className="mb-4 text-lg font-semibold">Event Timeline</h3>
            <OrderHistory order={order} embedded />
          </div>
        </>
      )}
    </div>
  );
}
