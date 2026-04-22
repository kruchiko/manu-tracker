import { useDurations } from "../hooks/useDurations";
import { formatDuration } from "../dashboard.utils";
import { StationBarChart } from "./StationBarChart";
import { useOverviewVisible } from "../OverviewVisibleContext";
import styles from "./StationDurations.module.css";

export function StationDurations() {
  const visible = useOverviewVisible();
  const { data, isLoading, error } = useDurations(visible);

  if (isLoading) {
    return <p className={styles.loading}>Loading analytics...</p>;
  }

  if (error) {
    return <p className={styles.error}>Failed to load analytics: {error.message}</p>;
  }

  const durations = data ?? [];

  if (durations.length === 0) {
    return <p className={styles.empty}>No stage duration data yet. Durations appear once jobs move between stations.</p>;
  }

  return (
    <div className={styles.stack}>
      <StationBarChart durations={durations} />

      <div className={styles.scrollX}>
        <table className={styles.table} role="grid">
          <thead>
            <tr className={styles.headerRow}>
              <th className={styles.th}>Station</th>
              <th className={styles.th}>Avg</th>
              <th className={styles.th}>Median</th>
              <th className={styles.th}>Min</th>
              <th className={styles.th}>Max</th>
              <th className={styles.th}>P95</th>
              <th className={`${styles.th} ${styles.thLast}`}>Jobs</th>
            </tr>
          </thead>
          <tbody>
            {durations.map((d) => (
              <tr key={d.stationId} className={styles.bodyRow}>
                <td className={styles.tdStation}>{d.stationName}</td>
                <td className={styles.td}>{formatDuration(d.avgSeconds)}</td>
                <td className={styles.td}>{formatDuration(d.medianSeconds)}</td>
                <td className={styles.td}>{formatDuration(d.minSeconds)}</td>
                <td className={styles.td}>{formatDuration(d.maxSeconds)}</td>
                <td className={styles.td}>{formatDuration(d.p95Seconds)}</td>
                <td className={styles.tdLast}>{d.jobCount}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
