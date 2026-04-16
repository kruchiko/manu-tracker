import { PageHeader } from "../../../shared/components/PageHeader";
import { OverviewVisibleContext } from "../OverviewVisibleContext";
import { DashboardCharts } from "./DashboardCharts";
import styles from "./DashboardPage.module.css";

export function DashboardPage() {
  return (
    <div className={styles.root}>
      <PageHeader
        title="Dashboard"
        subtitle="Stage duration analytics and station activity"
      />

      <OverviewVisibleContext.Provider value={true}>
        <DashboardCharts />
      </OverviewVisibleContext.Provider>
    </div>
  );
}
