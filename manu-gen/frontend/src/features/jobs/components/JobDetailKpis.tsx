import type { JobPipelineProgress } from "../jobs.types";
import { formatDuration } from "../utils/duration";
import type { JobJourneyStats } from "../utils/jobJourneyStats";
import styles from "./JobDetailKpis.module.css";

function StatCard({
  label,
  value,
  sub,
}: {
  label: string;
  value: string;
  sub?: string;
}): React.JSX.Element {
  return (
    <div className={styles.card}>
      <p className={styles.label}>{label}</p>
      <p className={styles.value}>{value}</p>
      {sub && <p className={styles.sub}>{sub}</p>}
    </div>
  );
}

interface JobDetailKpisProps {
  stats: JobJourneyStats;
  /** When set (e.g. board job or enriched GET /jobs/:id), show pipeline ETA card. */
  pipeline?: JobPipelineProgress | null;
}

export function JobDetailKpis({ stats, pipeline }: JobDetailKpisProps): React.JSX.Element {
  const showEta =
    pipeline != null &&
    pipeline.expectedSeconds != null &&
    pipeline.elapsedSeconds != null;

  const gridClass = showEta ? styles.grid4 : styles.grid3;

  return (
    <div className={`${styles.grid} ${gridClass}`}>
      <StatCard
        label="Total tracked time"
        value={stats.totalTrackedSeconds > 0 ? formatDuration(stats.totalTrackedSeconds) : "—"}
      />
      <StatCard
        label="Station visits"
        value={stats.stationVisits > 0 ? String(stats.stationVisits) : "—"}
      />
      <StatCard
        label="Longest dwell"
        value={stats.longestDwellSeconds > 0 ? formatDuration(stats.longestDwellSeconds) : "—"}
        sub={stats.longestDwellStation || undefined}
      />
      {showEta && pipeline != null && (
        <StatCard
          label="Pipeline ETA"
          value={
            pipeline.elapsedSeconds! <= pipeline.expectedSeconds!
              ? formatDuration(pipeline.expectedSeconds! - pipeline.elapsedSeconds!)
              : `Overdue ${formatDuration(pipeline.elapsedSeconds! - pipeline.expectedSeconds!)}`
          }
          sub={`${formatDuration(pipeline.elapsedSeconds!)} of ${formatDuration(pipeline.expectedSeconds!)}`}
        />
      )}
    </div>
  );
}
