import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";
import type { OrderHistoryEntry } from "../dashboard.types";
import { formatDuration } from "../dashboard.utils";
import { buildStationColorMap } from "../dashboard.colors";

interface OrderJourneyChartProps {
  entries: OrderHistoryEntry[];
}

interface StationSegment {
  station: string;
  seconds: number;
  color: string;
}

function aggregateByStation(entries: OrderHistoryEntry[]): StationSegment[] {
  const totals = new Map<string, number>();
  const stationOrder: string[] = [];

  for (const entry of entries) {
    if (entry.durationSeconds === null || entry.durationSeconds <= 0) continue;
    if (entry.phase !== "departed" && entry.phase !== "scan") continue;
    if (!totals.has(entry.station)) stationOrder.push(entry.station);
    totals.set(entry.station, (totals.get(entry.station) ?? 0) + entry.durationSeconds);
  }

  const colorMap = buildStationColorMap(stationOrder);

  return stationOrder.map((station) => ({
    station,
    seconds: totals.get(station)!,
    color: colorMap.get(station)!,
  }));
}

function CustomTooltip({ active, payload }: { active?: boolean; payload?: Array<{ payload: StationSegment }> }) {
  if (!active || !payload?.[0]) return null;
  const { station, seconds } = payload[0].payload;
  return (
    <div className="rounded-md border bg-white px-3 py-2 text-sm shadow-lg">
      <p className="font-medium text-gray-900">{station}</p>
      <p className="text-gray-500">{formatDuration(seconds)}</p>
    </div>
  );
}

export function OrderJourneyChart({ entries }: OrderJourneyChartProps) {
  const segments = aggregateByStation(entries);

  if (segments.length === 0) {
    return <p className="text-sm text-gray-500">No duration data to display.</p>;
  }

  return (
    <div>
      <ResponsiveContainer width="100%" height={80}>
        <BarChart data={segments} layout="vertical" margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
          <XAxis type="number" hide />
          <YAxis type="category" dataKey="station" hide />
          <Tooltip content={<CustomTooltip />} cursor={false} />
          <Bar dataKey="seconds" radius={[4, 4, 4, 4]} barSize={32}>
            {segments.map((seg) => (
              <Cell key={seg.station} fill={seg.color} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>

      <div className="mt-3 flex flex-wrap gap-3">
        {segments.map((seg) => (
          <div key={seg.station} className="flex items-center gap-1.5 text-sm">
            <span
              className="inline-block h-3 w-3 rounded-sm"
              style={{ backgroundColor: seg.color }}
            />
            <span className="text-gray-700">{seg.station}</span>
            <span className="text-gray-400">{formatDuration(seg.seconds)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
