import { useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { jobDetailUrlFromLiveOperations } from "../../../shared/navigation/pageRoutes";
import { PageHeader } from "../../../shared/components/PageHeader";
import pageShell from "../../../shared/components/PageShell.module.css";
import { LiveOperationsOverview } from "./LiveOperationsOverview";
import { useJobBoard } from "../hooks/useJobBoard";
import { OverviewVisibleContext } from "../OverviewVisibleContext";
import styles from "./LiveOperationsPage.module.css";

export function LiveOperationsPage() {
  const navigate = useNavigate();
  const boardQuery = useJobBoard();
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = containerRef.current;
    if (el && typeof el.scrollTo === "function") {
      el.scrollTo({ top: 0 });
    }
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
            onSelectJob={(job) => navigate(jobDetailUrlFromLiveOperations(job.id))}
            boardQuery={boardQuery}
          />
        </OverviewVisibleContext.Provider>
      </div>
    </div>
  );
}
