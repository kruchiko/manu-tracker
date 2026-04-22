import { useSummary } from "../hooks/useSummary";
import { formatDuration } from "../dashboard.utils";
import { useOverviewVisible } from "../OverviewVisibleContext";
import sectionPanel from "../../../shared/components/SectionPanel.module.css";
import styles from "./KpiCards.module.css";

interface KpiCardProps {
  label: string;
  value: string;
  accent?: "default" | "danger";
}

function KpiCard({ label, value, accent = "default" }: KpiCardProps) {
  return (
    <div
      className={`${sectionPanel.surface} ${sectionPanel.paddingCompact} ${accent === "danger" ? styles.danger : ""}`}
    >
      <p className={styles.label}>{label}</p>
      <p className={styles.value}>{value}</p>
    </div>
  );
}

export function KpiCards() {
  const visible = useOverviewVisible();
  const { data, isLoading } = useSummary(visible);

  if (isLoading || !data) {
    return (
      <div className={styles.grid}>
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className={styles.skeleton} />
        ))}
      </div>
    );
  }

  const violationAccent = data.thresholdViolations > 0 ? "danger" : "default";

  return (
    <div className={styles.grid}>
      <KpiCard
        label="Active jobs (30m)"
        value={`${data.activeJobs} / ${data.totalTrackedJobs}`}
      />
      <KpiCard
        label="Avg dwell time"
        value={data.avgDwellSeconds > 0 ? formatDuration(data.avgDwellSeconds) : "--"}
      />
      <KpiCard label="Bottleneck station" value={data.bottleneckStation ?? "--"} />
      <KpiCard
        label="Threshold violations"
        value={String(data.thresholdViolations)}
        accent={violationAccent}
      />
    </div>
  );
}
