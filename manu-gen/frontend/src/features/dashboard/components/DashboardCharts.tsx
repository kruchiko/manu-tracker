import { StationDurations } from "./StationDurations";
import { ActivitySparklines } from "./ActivitySparklines";
import styles from "./DashboardCharts.module.css";

export function DashboardCharts() {
  return (
    <div className={styles.stack}>
      <section className={styles.card}>
        <h3 className={styles.cardTitle}>Stage Duration Analytics</h3>
        <StationDurations />
      </section>
      <section className={styles.card}>
        <h3 className={styles.cardTitle}>Station Activity (24h)</h3>
        <ActivitySparklines />
      </section>
    </div>
  );
}
