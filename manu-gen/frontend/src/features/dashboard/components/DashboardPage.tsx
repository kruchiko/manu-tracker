import { PageHeader } from "../../../shared/components/PageHeader";
import pageShell from "../../../shared/components/PageShell.module.css";
import { OverviewVisibleContext } from "../OverviewVisibleContext";
import { DashboardCharts } from "./DashboardCharts";

export function DashboardPage() {
  return (
    <div className={pageShell.column}>
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
