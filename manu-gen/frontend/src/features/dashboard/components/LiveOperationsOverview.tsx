import { JobBoard } from "./JobBoard";
import { KpiCards } from "./KpiCards";
import type { BoardJob } from "../dashboard.types";
import styles from "./LiveOperationsOverview.module.css";

interface LiveOperationsOverviewProps {
  selectedJobId: number | null;
  onSelectJob: (job: BoardJob) => void;
}

export function LiveOperationsOverview({ selectedJobId, onSelectJob }: LiveOperationsOverviewProps) {
  return (
    <>
      <KpiCards />

      <div className={styles.boardCard}>
        <h3 className={styles.boardTitle}>Live Job Board</h3>
        <JobBoard selectedJobId={selectedJobId} onSelectJob={onSelectJob} />
      </div>
    </>
  );
}
