import { useOrderHistory } from "../hooks/useOrderHistory";
import type { BoardOrder } from "../dashboard.types";
import { formatDuration, parseUtc } from "../dashboard.utils";

interface OrderHistoryProps {
  order: BoardOrder;
  onClose: () => void;
}

function formatTime(iso: string): string {
  const date = parseUtc(iso);
  return date.toLocaleString([], {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function OrderHistory({ order, onClose }: OrderHistoryProps) {
  const { data, isLoading, error } = useOrderHistory(order.id);

  return (
    <div className="rounded-lg border bg-white p-5 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-gray-900">
            {order.orderNumber} — {order.customerName}
          </h3>
          <p className="text-sm text-gray-500">{order.productType}</p>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
          aria-label="Close order history"
        >
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {isLoading && <p className="text-sm text-gray-500">Loading history...</p>}

      {error && <p className="text-sm text-red-600">Failed to load history: {error.message}</p>}

      {data && data.length === 0 && (
        <p className="text-sm text-gray-500">No tracking events recorded for this order yet.</p>
      )}

      {data && data.length > 0 && (
        <div className="relative overflow-y-auto pl-6" style={{ height: "200px" }}>
          {data.map((entry, index) => {
            const isLast = index === data.length - 1;
            return (
              <div key={`${entry.station}-${entry.arrivedAt}`} className="relative pb-5 last:pb-0">
                {!isLast && (
                  <div className="absolute left-[-16px] top-3 h-full w-px bg-gray-200" />
                )}
                <div className="absolute left-[-20px] top-1.5 h-2 w-2 rounded-full border-2 border-blue-500 bg-white" />
                <div>
                  <p className="font-medium text-gray-900">{entry.station}</p>
                  <p className="text-xs text-gray-500">{formatTime(entry.arrivedAt)}</p>
                  {entry.durationSeconds !== null && (
                    <p className="mt-0.5 text-xs text-gray-400">
                      Spent {formatDuration(entry.durationSeconds)}
                    </p>
                  )}
                  {isLast && entry.durationSeconds === null && (
                    <p className="mt-0.5 text-xs font-medium text-blue-600">Currently here</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
