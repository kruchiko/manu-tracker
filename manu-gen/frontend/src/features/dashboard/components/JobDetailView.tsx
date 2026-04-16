import { ChevronLeft } from "lucide-react";
import { useJobHistory } from "../../jobs/hooks/useJobHistory";
import { JobJourneyChart } from "../../jobs/components/JobJourneyChart";
import { PipelineProgress } from "../../jobs/components/PipelineProgress";
import { JobHistory } from "../../jobs/components/JobHistory";
import { JobDetailKpis } from "../../jobs/components/JobDetailKpis";
import { usePipeline } from "../../pipelines/hooks/usePipeline";
import type { BoardJob } from "../dashboard.types";
import { computeJobJourneyStats } from "../../jobs/utils/jobJourneyStats";
import styles from "./JobDetailView.module.css";

interface JobDetailViewProps {
  job: BoardJob;
  onBack: () => void;
  /** When the parent supplies a back control (e.g. page header), hide the inline link. */
  hideBackButton?: boolean;
}

export function JobDetailView({ job, onBack, hideBackButton = false }: JobDetailViewProps) {
  const { data, isLoading, error } = useJobHistory(job.id);
  const { data: pipelineData } = usePipeline(job.pipeline.id);
  const entries = data ?? [];
  const stats = computeJobJourneyStats(entries);

  return (
    <div className={styles.root}>
      {!hideBackButton && (
        <button type="button" onClick={onBack} className={styles.backButton}>
          <ChevronLeft size={16} strokeWidth={2} aria-hidden />
          Back to overview
        </button>
      )}

      <div className={styles.header}>
        <h2 className={styles.title}>
          {job.jobNumber} — {job.productType}
        </h2>
        <p className={styles.subtitle}>{job.trayCode}</p>
      </div>

      {isLoading && <p className={styles.loading}>Loading job details…</p>}
      {error && <p className={styles.error}>Failed to load job details: {error.message}</p>}

      {!isLoading && !error && (
        <div className={styles.stack}>
          {pipelineData && (
            <PipelineProgress
              pipeline={job.pipeline}
              steps={pipelineData.steps}
              historyEntries={entries}
            />
          )}

          <JobDetailKpis stats={stats} pipeline={job.pipeline} />

          {entries.length > 0 && (
            <div className={styles.chartCard}>
              <h3 className={styles.chartTitle}>Time distribution by station</h3>
              <JobJourneyChart entries={entries} />
            </div>
          )}

          <div className={styles.timelineCard}>
            <h3 className={styles.timelineTitle}>Event timeline</h3>
            <div className={styles.scrollMin}>
              <JobHistory job={job} embedded />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
