import type { JobPipelineProgress } from "../jobs.types";
import { formatDuration } from "../utils/duration";
import type { JobJourneyStats } from "../utils/jobJourneyStats";
import styles from "./JobDetailKpis.module.css";

/** Three journey metrics on job detail — aligned primary values; optional station line above value. */
function JourneyStatCard({
  label,
  value,
  preValue,
}: {
  label: string;
  value: string;
  preValue?: string;
}): React.JSX.Element {
  return (
    <div className={`${styles.card} ${styles.journeyCard}`}>
      <p className={styles.label}>{label}</p>
      <div className={styles.journeySpacer} aria-hidden />
      <div className={styles.journeyMetric}>
        <p className={styles.journeyPre}>{preValue?.trim() ? preValue : "\u00a0"}</p>
        <p className={styles.journeyValue}>{value}</p>
      </div>
    </div>
  );
}

/** Pipeline ETA — layout unchanged from original stacked card (no alignment requirement vs journey row). */
function PipelineEtaCard({
  value,
  sub,
}: {
  value: string;
  sub: string;
}): React.JSX.Element {
  return (
    <div className={styles.card}>
      <p className={styles.label}>Pipeline ETA</p>
      <p className={styles.value}>{value}</p>
      <p className={styles.sub}>{sub}</p>
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
      <JourneyStatCard
        label="Total tracked time"
        value={stats.totalTrackedSeconds > 0 ? formatDuration(stats.totalTrackedSeconds) : "—"}
      />
      <JourneyStatCard
        label="Station visits"
        value={stats.stationVisits > 0 ? String(stats.stationVisits) : "—"}
      />
      <JourneyStatCard
        label="Longest dwell"
        value={stats.longestDwellSeconds > 0 ? formatDuration(stats.longestDwellSeconds) : "—"}
        preValue={stats.longestDwellStation ?? undefined}
      />
      {showEta && pipeline != null && (
        <PipelineEtaCard
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
