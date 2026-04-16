import { useRef, useEffect } from "react";
import { PageHeader } from "../../../shared/components/PageHeader";
import pageShell from "../../../shared/components/PageShell.module.css";
import { LiveOperationsOverview } from "./LiveOperationsOverview";
import { useJobBoard } from "../hooks/useJobBoard";
import { OverviewVisibleContext } from "../OverviewVisibleContext";
import styles from "./LiveOperationsPage.module.css";

interface LiveOperationsPageProps {
  /** Opens the Jobs app page with full job detail (same as Jobs list → row). */
  onOpenJobDetail: (jobId: number) => void;
}

export function LiveOperationsPage({ onOpenJobDetail }: LiveOperationsPageProps) {
  const boardQuery = useJobBoard();
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    containerRef.current?.scrollTo({ top: 0 });
  }, []);

  return (
    <div ref={containerRef} className={pageShell.column}>
      <PageHeader
        title="Live Operations"
        subtitle="Floor KPIs, analytics charts, and live job board — open a job for full detail in Jobs"
      />

      <div className={styles.content} role="region" aria-label="Live operations overview">
        <OverviewVisibleContext.Provider value={true}>
          <LiveOperationsOverview
            onSelectJob={(job) => onOpenJobDetail(job.id)}
            boardQuery={boardQuery}
          />
        </OverviewVisibleContext.Provider>
      </div>
    </div>
  );
}
