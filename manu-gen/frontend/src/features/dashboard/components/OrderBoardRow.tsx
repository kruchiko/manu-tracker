import { useEffect, useState } from "react";
import type { BoardOrder, BoardOrderPipeline } from "../dashboard.types";
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

function durationColorClass(seconds: number | null, threshold: number | null): string {
  if (seconds === null) return "text-gray-400";
  if (threshold !== null) {
    if (seconds >= threshold) return "text-red-700 bg-red-50";
    if (seconds >= threshold * 0.75) return "text-yellow-700 bg-yellow-50";
    return "text-green-700 bg-green-50";
  }
  if (seconds < 3600) return "text-green-700 bg-green-50";
  if (seconds < 14400) return "text-yellow-700 bg-yellow-50";
  return "text-red-700 bg-red-50";
}

function pipelineProgressColor(pipeline: BoardOrderPipeline): string {
  if (pipeline.expectedSeconds === null || pipeline.elapsedSeconds === null) return "bg-blue-500";
  const ratio = pipeline.elapsedSeconds / pipeline.expectedSeconds;
  if (ratio >= 1) return "bg-red-500";
  if (ratio >= 0.75) return "bg-yellow-500";
  return "bg-green-500";
}

function useLiveDuration(arrivedAt: string | null, active: boolean): number | null {
  const [now, setNow] = useState(Date.now);

  useEffect(() => {
    if (!active || !arrivedAt) return;
    const id = setInterval(() => setNow(Date.now()), 1_000);
    return () => clearInterval(id);
  }, [active, arrivedAt]);

  if (!active || !arrivedAt) return null;
  return Math.max(0, Math.floor((now - parseUtc(arrivedAt).getTime()) / 1000));
}

function PipelineProgressBar({ pipeline }: { pipeline: BoardOrderPipeline }) {
  const fillColor = pipelineProgressColor(pipeline);
  const completedFraction = pipeline.stepPosition / pipeline.totalSteps;

  return (
    <div className="flex items-center gap-2">
      <div className="flex h-2 w-20 overflow-hidden rounded-full bg-gray-200">
        <div
          className={`rounded-full transition-all ${fillColor}`}
          style={{ width: `${Math.min(100, completedFraction * 100)}%` }}
        />
      </div>
      <span className="whitespace-nowrap text-xs text-gray-500">
        {pipeline.stepPosition}/{pipeline.totalSteps}
      </span>
      {pipeline.expectedSeconds !== null && pipeline.elapsedSeconds !== null && (
        <span className="whitespace-nowrap text-xs text-gray-400">
          {formatDuration(pipeline.elapsedSeconds)}/{formatDuration(pipeline.expectedSeconds)}
        </span>
      )}
    </div>
  );
}

export function OrderBoardRow({ order, isSelected, onSelect }: OrderBoardRowProps) {
  const durationSeconds = useLiveDuration(order.stationArrivedAt, order.currentStation !== null);
  const colorClass = durationColorClass(durationSeconds, order.maxDurationSeconds);

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
        <span className="text-gray-700">{order.pipeline.name}</span>
      </td>
      <td className="py-3 pr-4 text-sm">
        <PipelineProgressBar pipeline={order.pipeline} />
      </td>
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
