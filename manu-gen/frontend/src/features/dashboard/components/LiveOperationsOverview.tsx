import type { UseQueryResult } from "@tanstack/react-query";
import { JobBoard } from "./JobBoard";
import { KpiCards } from "./KpiCards";
import type { BoardJob } from "../dashboard.types";
import styles from "./LiveOperationsOverview.module.css";

interface LiveOperationsOverviewProps {
  selectedJobId: number | null;
  onSelectJob: (job: BoardJob) => void;
  boardQuery: UseQueryResult<BoardJob[], Error>;
}

export function LiveOperationsOverview({
  selectedJobId,
  onSelectJob,
  boardQuery,
}: LiveOperationsOverviewProps) {
  return (
    <>
      <KpiCards />

      <div className={styles.boardCard}>
        <h3 className={styles.boardTitle}>Live Job Board</h3>
        <JobBoard
          selectedJobId={selectedJobId}
          onSelectJob={onSelectJob}
          boardQuery={boardQuery}
        />
      </div>
    </>
  );
}
