import { useMemo, useEffect, useRef } from "react";
import { useOrderHistory } from "../hooks/useOrderHistory";
import type { BoardOrder, OrderHistoryEntry, OrderHistoryPhase } from "../dashboard.types";
import { formatDuration, parseUtc } from "../dashboard.utils";
import { buildStationColorMap } from "../dashboard.colors";

interface OrderHistoryProps {
  order: BoardOrder;
  onClose?: () => void;
  /** When true, renders without the card wrapper and header (used inside OrderDetailView). */
  embedded?: boolean;
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

function entryTitle(entry: OrderHistoryEntry): string {
  switch (entry.phase) {
    case "arrived":
      return `Arrived — ${entry.station}`;
    case "departed":
      return `Left — ${entry.station}`;
    default:
      return entry.station;
  }
}

function showCurrentlyHere(entry: OrderHistoryEntry, isLast: boolean): boolean {
  if (!isLast || entry.durationSeconds !== null) return false;
  return entry.phase === "arrived" || entry.phase === "scan";
}

export function OrderHistory({ order, onClose, embedded }: OrderHistoryProps) {
  const { data, isLoading, error } = useOrderHistory(order.id);
  const scrollRef = useRef<HTMLDivElement>(null);

  const colorMap = useMemo(
    () => buildStationColorMap((data ?? []).map((e) => e.station)),
    [data],
  );

  const maxDuration = useMemo(
    () => Math.max(1, ...(data ?? []).map((e) => e.durationSeconds ?? 0)),
    [data],
  );

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [data]);

  const timeline = (
    <>
      {isLoading && <p className="text-sm text-gray-500">Loading history...</p>}

      {error && <p className="text-sm text-red-600">Failed to load history: {error.message}</p>}

      {data && data.length === 0 && (
        <p className="text-sm text-gray-500">No tracking events recorded for this order yet.</p>
      )}

      {data && data.length > 0 && (
        <div ref={scrollRef} className="relative overflow-y-auto pl-6" style={embedded ? undefined : { height: "200px" }}>
          {data.map((entry, index) => {
            const isLast = index === data.length - 1;
            const phaseLabel: Record<OrderHistoryPhase, string> = {
              arrived: "Arrived",
              departed: "Left",
              scan: "Scan",
            };
            const stationColor = colorMap.get(entry.station) ?? "#3b82f6";
            const hasDuration = entry.durationSeconds !== null && entry.durationSeconds > 0;
            const barWidthPercent = hasDuration
              ? Math.max(4, (entry.durationSeconds! / maxDuration) * 100)
              : 0;

            return (
              <div key={entry.id} className="relative pb-5 last:pb-0">
                {!isLast && (
                  <div className="absolute left-[-16px] top-3 h-full w-px bg-gray-200" />
                )}
                <div
                  className="absolute left-[-20px] top-1.5 h-2 w-2 rounded-full border-2 bg-white"
                  style={{ borderColor: stationColor }}
                />
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
                    {phaseLabel[entry.phase]}
                  </p>
                  <p className="font-medium text-gray-900">{entryTitle(entry)}</p>
                  <p className="text-xs text-gray-500">{formatTime(entry.at)}</p>

                  {entry.phase === "departed" && entry.durationSeconds !== null && (
                    <div className="mt-1.5 flex items-center gap-2">
                      <div
                        className="h-2 rounded-full"
                        style={{
                          width: `${barWidthPercent}%`,
                          backgroundColor: stationColor,
                          opacity: 0.7,
                        }}
                      />
                      <span className="shrink-0 text-xs text-gray-400">
                        {formatDuration(entry.durationSeconds)}
                      </span>
                    </div>
                  )}
                  {entry.phase === "scan" && entry.durationSeconds !== null && (
                    <div className="mt-1.5 flex items-center gap-2">
                      <div
                        className="h-2 rounded-full"
                        style={{
                          width: `${barWidthPercent}%`,
                          backgroundColor: stationColor,
                          opacity: 0.4,
                        }}
                      />
                      <span className="shrink-0 text-xs text-gray-400">
                        {formatDuration(entry.durationSeconds)}
                      </span>
                    </div>
                  )}
                  {showCurrentlyHere(entry, isLast) && (
                    <p className="mt-0.5 text-xs font-medium text-blue-600">Currently at station</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </>
  );

  if (embedded) {
    return timeline;
  }

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
      {timeline}
    </div>
  );
}
