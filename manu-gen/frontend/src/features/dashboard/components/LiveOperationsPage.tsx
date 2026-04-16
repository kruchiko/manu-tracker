import { useState, useRef, useEffect } from "react";
import { PageHeader } from "../../../shared/components/PageHeader";
import { JobDetailView } from "./JobDetailView";
import { LiveOperationsOverview } from "./LiveOperationsOverview";
import { useJobBoard } from "../hooks/useJobBoard";
import { OverviewVisibleContext } from "../OverviewVisibleContext";
import styles from "./LiveOperationsPage.module.css";

export function LiveOperationsPage() {
  const [selectedJobId, setSelectedJobId] = useState<number | null>(null);
  const { data: jobs } = useJobBoard();
  const selectedJob = jobs?.find((j) => j.id === selectedJobId) ?? null;
  const containerRef = useRef<HTMLDivElement>(null);
  const drilled = selectedJob !== null;

  useEffect(() => {
    containerRef.current?.scrollTo({ top: 0 });
  }, [selectedJobId]);

  return (
    <div ref={containerRef} className={styles.root}>
      <PageHeader
        title="Live Operations"
        subtitle="Floor KPIs, live job board, and job drill-in"
      />

      <div className={styles.drillShell}>
        <div
          className={styles.carousel}
          style={{ transform: drilled ? "translateX(-100%)" : "translateX(0)" }}
        >
          <div className={styles.pane}>
            <OverviewVisibleContext.Provider value={!drilled}>
              <LiveOperationsOverview
                selectedJobId={selectedJobId}
                onSelectJob={(job) => setSelectedJobId(job.id)}
              />
            </OverviewVisibleContext.Provider>
          </div>

          <div className={styles.pane}>
            {selectedJob && (
              <JobDetailView job={selectedJob} onBack={() => setSelectedJobId(null)} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
