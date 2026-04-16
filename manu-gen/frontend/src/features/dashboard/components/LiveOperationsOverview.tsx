import type { UseQueryResult } from "@tanstack/react-query";
import sectionPanel from "../../../shared/components/SectionPanel.module.css";
import { DashboardCharts } from "./DashboardCharts";
import { JobBoard } from "./JobBoard";
import { KpiCards } from "./KpiCards";
import type { BoardJob } from "../dashboard.types";
import styles from "./LiveOperationsOverview.module.css";

interface LiveOperationsOverviewProps {
  onSelectJob: (job: BoardJob) => void;
  boardQuery: UseQueryResult<BoardJob[], Error>;
}

export function LiveOperationsOverview({ onSelectJob, boardQuery }: LiveOperationsOverviewProps) {
  return (
    <div className={styles.stack}>
      <KpiCards />

      <div
        className={`${sectionPanel.surface} ${sectionPanel.paddingSection}`}
        aria-labelledby="live-job-board-heading"
      >
        <h2 id="live-job-board-heading" className={sectionPanel.sectionTitle}>
          Live Job Board
        </h2>
        <JobBoard onSelectJob={onSelectJob} boardQuery={boardQuery} />
      </div>

      <DashboardCharts />
    </div>
  );
}
