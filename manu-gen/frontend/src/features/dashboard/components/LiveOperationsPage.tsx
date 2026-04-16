import { useState, useRef, useEffect } from "react";
import { PageHeader } from "../../../shared/components/PageHeader";
import pageShell from "../../../shared/components/PageShell.module.css";
import { JobDetailView } from "./JobDetailView";
import { LiveOperationsOverview } from "./LiveOperationsOverview";
import { useJobBoard } from "../hooks/useJobBoard";
import { OverviewVisibleContext } from "../OverviewVisibleContext";
import styles from "./LiveOperationsPage.module.css";

export function LiveOperationsPage() {
  const [selectedJobId, setSelectedJobId] = useState<number | null>(null);
  const boardQuery = useJobBoard();
  const selectedJob = boardQuery.data?.find((j) => j.id === selectedJobId) ?? null;
  const containerRef = useRef<HTMLDivElement>(null);
  const drilled = selectedJob !== null;

  useEffect(() => {
    containerRef.current?.scrollTo({ top: 0 });
  }, [selectedJobId]);

  return (
    <div ref={containerRef} className={`${pageShell.column} ${pageShell.overflowHidden}`}>
      <PageHeader
        title="Live Operations"
        subtitle="Floor KPIs, live job board, and job drill-in"
      />

      <div
        className={styles.drillShell}
        role="region"
        aria-label="Live operations overview and job detail"
      >
        <div
          className={styles.carousel}
          style={{ transform: drilled ? "translateX(-100%)" : "translateX(0)" }}
        >
          <div className={styles.pane} aria-hidden={drilled}>
            <OverviewVisibleContext.Provider value={!drilled}>
              <LiveOperationsOverview
                selectedJobId={selectedJobId}
                onSelectJob={(job) => setSelectedJobId(job.id)}
                boardQuery={boardQuery}
              />
            </OverviewVisibleContext.Provider>
          </div>

          <div className={styles.pane} aria-hidden={!drilled}>
            {selectedJob && (
              <JobDetailView job={selectedJob} onBack={() => setSelectedJobId(null)} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
