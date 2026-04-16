import { useState, useRef, useEffect } from "react";
import { ChevronLeft } from "lucide-react";
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
    <div ref={containerRef} className={pageShell.column}>
      <PageHeader
        title="Live Operations"
        subtitle="Floor KPIs, analytics charts, live job board, and job drill-in"
        action={
          drilled ? (
            <button
              type="button"
              className={styles.headerBack}
              onClick={() => setSelectedJobId(null)}
            >
              <ChevronLeft size={16} strokeWidth={2} aria-hidden />
              Back to overview
            </button>
          ) : undefined
        }
      />

      <div
        className={styles.content}
        role="region"
        aria-label={drilled ? "Job detail" : "Live operations overview"}
      >
        {drilled && selectedJob ? (
          <JobDetailView
            job={selectedJob}
            onBack={() => setSelectedJobId(null)}
            hideBackButton
          />
        ) : (
          <OverviewVisibleContext.Provider value={true}>
            <LiveOperationsOverview
              selectedJobId={selectedJobId}
              onSelectJob={(job) => setSelectedJobId(job.id)}
              boardQuery={boardQuery}
            />
          </OverviewVisibleContext.Provider>
        )}
      </div>
    </div>
  );
}
