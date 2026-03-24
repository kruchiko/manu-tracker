import { LineChart, Line, ResponsiveContainer, Tooltip } from "recharts";
import { useActivity } from "../hooks/useActivity";
import { buildStationColorMap } from "../dashboard.colors";
import { useOverviewVisible } from "../OverviewVisibleContext";

function formatHour(iso: string): string {
  const d = new Date(iso + "Z");
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function SparkTooltip({ active, payload }: { active?: boolean; payload?: Array<{ payload: { hour: string; count: number } }> }) {
  if (!active || !payload?.[0]) return null;
  const { hour, count } = payload[0].payload;
  return (
    <div className="rounded border bg-white px-2 py-1 text-xs shadow">
      <span className="font-medium">{formatHour(hour)}</span>
      <span className="ml-2 text-gray-500">{count} visits</span>
    </div>
  );
}

export function ActivitySparklines() {
  const visible = useOverviewVisible();
  const { data, isLoading } = useActivity(visible);

  if (isLoading) {
    return <p className="text-sm text-gray-500">Loading activity...</p>;
  }

  const stations = data ?? [];

  if (stations.length === 0) {
    return <p className="text-sm text-gray-500">No station activity in the last 24 hours.</p>;
  }

  const colorMap = buildStationColorMap(stations.map((s) => s.stationName));

  return (
    <div className="space-y-4">
      {stations.map((station) => (
        <div key={station.stationId} className="flex items-center gap-4">
          <span className="w-28 shrink-0 truncate text-sm font-medium text-gray-700">
            {station.stationName}
          </span>
          <div className="flex-1">
            <ResponsiveContainer width="100%" height={36}>
              <LineChart data={station.buckets}>
                <Tooltip content={<SparkTooltip />} />
                <Line
                  type="monotone"
                  dataKey="count"
                  stroke={colorMap.get(station.stationName)}
                  strokeWidth={2}
                  dot={false}
                  isAnimationActive={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <span className="w-14 shrink-0 text-right text-xs text-gray-400">
            {station.buckets.reduce((sum, b) => sum + b.count, 0)} total
          </span>
        </div>
      ))}
    </div>
  );
}
