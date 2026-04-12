import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";
import type { JobHistoryEntry } from "../jobs.types";
import { formatDuration } from "../utils/duration";
import { buildStationFillMap } from "../utils/chartFills";
import styles from "./JobJourneyChart.module.css";

interface JobJourneyChartProps {
  entries: JobHistoryEntry[];
}

interface StationSegment {
  station: string;
  seconds: number;
  color: string;
}

function aggregateByStation(entries: JobHistoryEntry[]): StationSegment[] {
  const totals = new Map<string, number>();
  const stationOrder: string[] = [];

  for (const entry of entries) {
    if (entry.durationSeconds === null || entry.durationSeconds <= 0) continue;
    if (entry.phase !== "departed" && entry.phase !== "scan") continue;
    if (!totals.has(entry.station)) stationOrder.push(entry.station);
    totals.set(entry.station, (totals.get(entry.station) ?? 0) + entry.durationSeconds);
  }

  const colorMap = buildStationFillMap(stationOrder);

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
    <div className={styles.tooltip}>
      <p className={styles.tooltipTitle}>{station}</p>
      <p className={styles.tooltipSub}>{formatDuration(seconds)}</p>
    </div>
  );
}

export function JobJourneyChart({ entries }: JobJourneyChartProps) {
  const segments = aggregateByStation(entries);

  if (segments.length === 0) {
    return <p className={styles.empty}>No duration data to display.</p>;
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

      <div className={styles.legend}>
        {segments.map((seg) => (
          <div key={seg.station} className={styles.legendItem}>
            <span className={styles.swatch} style={{ backgroundColor: seg.color }} />
            <span className={styles.stationName}>{seg.station}</span>
            <span className={styles.duration}>{formatDuration(seg.seconds)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
