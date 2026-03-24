import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
  ReferenceArea,
} from "recharts";
import type { StationDuration } from "../dashboard.types";
import { formatDuration } from "../dashboard.utils";
import { buildStationColorMap } from "../dashboard.colors";

interface StationBarChartProps {
  durations: StationDuration[];
}

interface ChartRow {
  name: string;
  avg: number;
  min: number;
  median: number;
  max: number;
  p95: number;
  threshold: number | null;
  color: string;
}

function CustomTooltip({ active, payload }: { active?: boolean; payload?: Array<{ payload: ChartRow }> }) {
  if (!active || !payload?.[0]) return null;
  const d = payload[0].payload;
  return (
    <div className="rounded-md border bg-white px-3 py-2 text-sm shadow-lg">
      <p className="mb-1 font-medium text-gray-900">{d.name}</p>
      <div className="grid grid-cols-2 gap-x-4 gap-y-0.5 text-gray-600">
        <span>Avg</span><span className="font-medium">{formatDuration(d.avg)}</span>
        <span>Median</span><span>{formatDuration(d.median)}</span>
        <span>Min</span><span>{formatDuration(d.min)}</span>
        <span>Max</span><span>{formatDuration(d.max)}</span>
        <span>P95</span><span>{formatDuration(d.p95)}</span>
        {d.threshold !== null && (
          <>
            <span className="text-red-600">Threshold</span>
            <span className="text-red-600">{formatDuration(d.threshold)}</span>
          </>
        )}
      </div>
    </div>
  );
}

export function StationBarChart({ durations }: StationBarChartProps) {
  const colorMap = buildStationColorMap(durations.map((d) => d.stationName));

  const data: ChartRow[] = durations.map((d) => ({
    name: d.stationName,
    avg: d.avgSeconds,
    min: d.minSeconds,
    median: d.medianSeconds,
    max: d.maxSeconds,
    p95: d.p95Seconds,
    threshold: d.maxDurationSeconds,
    color: colorMap.get(d.stationName)!,
  }));

  const xMax = Math.max(...data.map((d) => Math.max(d.max, d.threshold ?? 0)));

  return (
    <ResponsiveContainer width="100%" height={Math.max(120, data.length * 48 + 40)}>
      <BarChart data={data} layout="vertical" margin={{ top: 4, right: 20, bottom: 4, left: 8 }}>
        <XAxis
          type="number"
          tickFormatter={(v: number) => formatDuration(v)}
          tick={{ fontSize: 11, fill: "#9ca3af" }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          type="category"
          dataKey="name"
          width={100}
          tick={{ fontSize: 12, fill: "#374151" }}
          axisLine={false}
          tickLine={false}
        />
        <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(0,0,0,0.04)" }} />
        {data
          .filter((d) => d.threshold !== null)
          .map((d) => (
            <ReferenceArea
              key={`zone-${d.name}`}
              y1={d.name}
              y2={d.name}
              x1={d.threshold!}
              x2={xMax * 1.05}
              fill="#fef2f2"
              fillOpacity={0.6}
              ifOverflow="hidden"
            />
          ))}
        <Bar dataKey="avg" radius={[0, 4, 4, 0]} barSize={24} name="Avg Duration">
          {data.map((row) => {
            const exceeds = row.threshold !== null && row.avg >= row.threshold;
            return (
              <Cell
                key={row.name}
                fill={exceeds ? "#ef4444" : row.color}
                opacity={exceeds ? 0.9 : 0.8}
              />
            );
          })}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
