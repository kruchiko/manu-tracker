import { LineChart, Line, ResponsiveContainer, Tooltip } from "recharts";
import { useActivity } from "../hooks/useActivity";
import { buildStationColorMap } from "../dashboard.colors";
import { useOverviewVisible } from "../OverviewVisibleContext";
import styles from "./ActivitySparklines.module.css";

function formatHour(iso: string): string {
  const d = new Date(iso + "Z");
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function SparkTooltip({ active, payload }: { active?: boolean; payload?: Array<{ payload: { hour: string; count: number } }> }) {
  if (!active || !payload?.[0]) return null;
  const { hour, count } = payload[0].payload;
  return (
    <div className={styles.tooltip}>
      <span className={styles.tooltipLabel}>{formatHour(hour)}</span>
      <span className={styles.tooltipCount}>{count} visits</span>
    </div>
  );
}

export function ActivitySparklines() {
  const visible = useOverviewVisible();
  const { data, isLoading } = useActivity(visible);

  if (isLoading) {
    return <p className={styles.loading}>Loading activity...</p>;
  }

  const stations = data ?? [];

  if (stations.length === 0) {
    return <p className={styles.empty}>No station activity in the last 24 hours.</p>;
  }

  const colorMap = buildStationColorMap(stations.map((s) => s.stationName));

  return (
    <div className={styles.list}>
      {stations.map((station) => (
        <div key={station.stationId} className={styles.row}>
          <span className={styles.stationName}>
            {station.stationName}
          </span>
          <div className={styles.chart}>
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
          <span className={styles.total}>
            {station.buckets.reduce((sum, b) => sum + b.count, 0)} total
          </span>
        </div>
      ))}
    </div>
  );
}
