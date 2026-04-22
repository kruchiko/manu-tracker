import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import type { StationDuration } from "../dashboard.types";
import { formatDuration } from "../dashboard.utils";
import { buildStationColorMap } from "../dashboard.colors";
import styles from "./StationBarChart.module.css";

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
  color: string;
}

function CustomTooltip({ active, payload }: { active?: boolean; payload?: Array<{ payload: ChartRow }> }) {
  if (!active || !payload?.[0]) return null;
  const d = payload[0].payload;
  return (
    <div className={styles.tooltip}>
      <p className={styles.tooltipTitle}>{d.name}</p>
      <div className={styles.tooltipGrid}>
        <span>Avg</span><span className={styles.tooltipValue}>{formatDuration(d.avg)}</span>
        <span>Median</span><span>{formatDuration(d.median)}</span>
        <span>Min</span><span>{formatDuration(d.min)}</span>
        <span>Max</span><span>{formatDuration(d.max)}</span>
        <span>P95</span><span>{formatDuration(d.p95)}</span>
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
    color: colorMap.get(d.stationName)!,
  }));

  return (
    <ResponsiveContainer width="100%" height={Math.max(120, data.length * 48 + 40)}>
      <BarChart data={data} layout="vertical" margin={{ top: 4, right: 20, bottom: 4, left: 8 }}>
        <XAxis
          type="number"
          tickFormatter={(v: number) => formatDuration(v)}
          tick={{ fontSize: 11, fill: "var(--text-muted)" }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          type="category"
          dataKey="name"
          width={100}
          tick={{ fontSize: 12, fill: "var(--text-secondary)" }}
          axisLine={false}
          tickLine={false}
        />
        <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(0,0,0,0.04)" }} />
        <Bar dataKey="avg" radius={[0, 4, 4, 0]} barSize={24} name="Avg Duration">
          {data.map((row) => (
            <Cell key={row.name} fill={row.color} opacity={0.8} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
