import type { BoardOrder } from "../dashboard.types";
import { formatDuration, parseUtc } from "../dashboard.utils";

interface OrderBoardRowProps {
  order: BoardOrder;
  isSelected: boolean;
  onSelect: (order: BoardOrder) => void;
}

function formatLastSeen(iso: string): string {
  const date = parseUtc(iso);
  const now = new Date();
  const isToday = date.toDateString() === now.toDateString();
  const time = date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  return isToday ? `${time} today` : date.toLocaleDateString([], { month: "short", day: "numeric" }) + ` ${time}`;
}

function durationColorClass(seconds: number | null): string {
  if (seconds === null) return "text-gray-400";
  if (seconds < 3600) return "text-green-700 bg-green-50";
  if (seconds < 14400) return "text-yellow-700 bg-yellow-50";
  return "text-red-700 bg-red-50";
}

function computeDurationSeconds(lastSeenAt: string | null): number | null {
  if (!lastSeenAt) return null;
  return Math.floor((Date.now() - parseUtc(lastSeenAt).getTime()) / 1000);
}

export function OrderBoardRow({ order, isSelected, onSelect }: OrderBoardRowProps) {
  const durationSeconds = computeDurationSeconds(order.lastSeenAt);
  const colorClass = durationColorClass(durationSeconds);

  return (
    <tr
      onClick={() => onSelect(order)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onSelect(order);
        }
      }}
      tabIndex={0}
      aria-selected={isSelected}
      className={`cursor-pointer border-b transition-colors hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500 ${
        isSelected ? "bg-blue-50" : ""
      }`}
    >
      <td className="py-3 pr-4 font-mono text-sm">{order.orderNumber}</td>
      <td className="py-3 pr-4 text-sm">{order.customerName}</td>
      <td className="py-3 pr-4 text-sm">{order.productType}</td>
      <td className="py-3 pr-4 text-sm">
        {order.currentStation ? order.currentStation.name : (
          <span className="italic text-gray-400">(not yet seen)</span>
        )}
      </td>
      <td className="py-3 pr-4 text-sm">
        {durationSeconds !== null ? (
          <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${colorClass}`}>
            {formatDuration(durationSeconds)}
          </span>
        ) : (
          <span className="text-gray-400">--</span>
        )}
      </td>
      <td className="py-3 text-sm">
        {order.lastSeenAt ? formatLastSeen(order.lastSeenAt) : (
          <span className="text-gray-400">--</span>
        )}
      </td>
    </tr>
  );
}
