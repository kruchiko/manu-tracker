import { StationDurations } from "./StationDurations";
import { ActivitySparklines } from "./ActivitySparklines";
import sectionPanel from "../../../shared/components/SectionPanel.module.css";
import styles from "./DashboardCharts.module.css";

export function DashboardCharts() {
  return (
    <div className={styles.stack}>
      <section
        className={`${sectionPanel.surface} ${sectionPanel.paddingSection}`}
        aria-labelledby="dash-duration-heading"
      >
        <h2 id="dash-duration-heading" className={sectionPanel.sectionTitle}>
          Stage Duration Analytics
        </h2>
        <StationDurations />
      </section>
      <section
        className={`${sectionPanel.surface} ${sectionPanel.paddingSection}`}
        aria-labelledby="dash-activity-heading"
      >
        <h2 id="dash-activity-heading" className={sectionPanel.sectionTitle}>
          Station Activity (24h)
        </h2>
        <ActivitySparklines />
      </section>
    </div>
  );
}
