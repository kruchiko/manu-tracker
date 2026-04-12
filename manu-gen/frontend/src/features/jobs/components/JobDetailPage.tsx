import { useCallback, useEffect, useRef, useState } from "react";
import { ChevronLeft, Printer } from "lucide-react";
import { ConfirmDialog } from "../../../shared/components/ConfirmDialog";
import { usePipeline } from "../../pipelines/hooks/usePipeline";
import { JobJourneyChart } from "./JobJourneyChart";
import { JobHistory } from "./JobHistory";
import { JobDetailKpis } from "./JobDetailKpis";
import { PipelineProgress } from "./PipelineProgress";
import { QrPreview } from "./QrPreview";
import { JobStatusBadge } from "./JobStatusBadge";
import { useJobHistory } from "../hooks/useJobHistory";
import { useDeleteJob } from "../hooks/useDeleteJob";
import type { Job } from "../jobs.types";
import { computeJobJourneyStats } from "../utils/jobJourneyStats";
import styles from "./JobDetailPage.module.css";

interface JobDetailPageProps {
  job: Job;
  onBack: () => void;
  /** When true, open the print dialog after the QR preview is ready (e.g. Print Label from list). */
  printAfterMount?: boolean;
  onConsumedPrintIntent?: () => void;
}

export function JobDetailPage({
  job,
  onBack,
  printAfterMount = false,
  onConsumedPrintIntent,
}: JobDetailPageProps) {
  const { data: pipelineData } = usePipeline(job.pipelineId);
  const { data: historyData, isLoading: historyLoading, error: historyError } = useJobHistory(job.id);
  const entries = historyData ?? [];
  const stats = computeJobJourneyStats(entries);
  const pipelineBlock = job.pipeline;

  const deleteMutation = useDeleteJob();
  const printedRef = useRef(false);
  const [qrReady, setQrReady] = useState(false);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);

  const handleQrReady = useCallback(() => {
    setQrReady(true);
  }, []);

  useEffect(() => {
    if (!printAfterMount || !qrReady || printedRef.current) return;
    const frame = requestAnimationFrame(() => {
      window.print();
      printedRef.current = true;
      onConsumedPrintIntent?.();
    });
    return () => cancelAnimationFrame(frame);
  }, [printAfterMount, qrReady, onConsumedPrintIntent]);

  function handleConfirmDelete() {
    setConfirmDeleteOpen(false);
    deleteMutation.mutate(job.id, {
      onSuccess: () => onBack(),
    });
  }

  const stationsHint =
    pipelineBlock && pipelineData?.steps?.length
      ? `${pipelineBlock.stepPosition} of ${pipelineBlock.totalSteps} stations`
      : null;

  return (
    <div className={styles.page}>
      <ConfirmDialog
        open={confirmDeleteOpen}
        title="Delete job?"
        message={`Delete ${job.jobNumber}? This will also remove its allocations and tracking events.`}
        confirmLabel="Delete job"
        cancelLabel="Cancel"
        onConfirm={handleConfirmDelete}
        onCancel={() => setConfirmDeleteOpen(false)}
      />

      <header className={`${styles.header} ${styles.hideOnPrint}`}>
        <button type="button" onClick={onBack} className={styles.backBtn}>
          <ChevronLeft size={14} strokeWidth={1.5} aria-hidden />
          Jobs
        </button>
        <div className={styles.headerCenter}>
          <p className={styles.identity}>
            {job.jobNumber}
            <span className={styles.identitySep}> · </span>
            {job.trayCode}
          </p>
          <h1 className={styles.title}>{job.productType}</h1>
        </div>
        <div className={styles.headerActions}>
          <button type="button" className={styles.printHeaderBtn} onClick={() => window.print()}>
            <Printer size={11} strokeWidth={1.5} aria-hidden />
            Print Label
          </button>
        </div>
      </header>

      <div className={styles.grid}>
        <div className={styles.leftCol}>
          <div className={`${styles.metaGrid} ${styles.hideOnPrint}`}>
            <div className={styles.metaCell}>
              <div className={styles.metaLabel}>Customer Order</div>
              <div className={styles.metaValueMuted}>None — manual job</div>
            </div>
            <div className={styles.metaCell}>
              <div className={styles.metaLabel}>Status</div>
              <div className={styles.metaValue}>
                <JobStatusBadge status={job.status} />
              </div>
            </div>
            <div className={styles.metaCell}>
              <div className={styles.metaLabel}>Quantity</div>
              <div className={styles.metaValue}>{job.quantity} pcs</div>
            </div>
            <div className={styles.metaCell}>
              <div className={styles.metaLabel}>Pipeline</div>
              <div className={styles.metaValue}>{job.pipelineName}</div>
            </div>
            <div className={styles.metaCell}>
              <div className={styles.metaLabel}>Created</div>
              <div className={styles.metaValue}>
                {new Date(job.createdAt).toLocaleString("en-GB", {
                  day: "2-digit",
                  month: "short",
                  year: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </div>
            </div>
            <div className={styles.metaCell}>
              <div className={styles.metaLabel}>Tray code</div>
              <div className={`${styles.metaValue} ${styles.metaMono}`}>{job.trayCode}</div>
            </div>
          </div>

          <div className={styles.hideOnPrint}>
            <JobDetailKpis stats={stats} pipeline={pipelineBlock ?? null} />
          </div>

          <div className={styles.qrCard}>
            <div className={`${styles.qrCardHead} ${styles.hideOnPrint}`}>
              <span className={styles.qrCardTitle}>QR Label</span>
            </div>
            <div className={`${styles.qrCardBody} ${styles.qrCardBodyPrint}`}>
              <QrPreview job={job} variant="inline" onReady={handleQrReady} />
              <p className={`${styles.qrMeta} ${styles.hideOnPrint}`}>
                {job.jobNumber} · {job.productType}
                <br />
                Pipeline: {job.pipelineName}
                <br />
                Order: None — manual job
              </p>
            </div>
          </div>

          <div className={`${styles.dangerZone} ${styles.hideOnPrint}`}>
            <button
              type="button"
              className={styles.deleteBtn}
              onClick={() => setConfirmDeleteOpen(true)}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? "Deleting…" : "Delete job"}
            </button>
          </div>
        </div>

        <div className={`${styles.rightCol} ${styles.hideOnPrint}`}>
          <div className={styles.panel}>
            <div className={styles.panelHead}>
              <span className={styles.panelTitle}>Pipeline progress</span>
              {stationsHint && <span className={styles.panelHint}>{stationsHint}</span>}
            </div>
            <div className={styles.panelBodyScroll}>
              {pipelineBlock && pipelineData?.steps?.length ? (
                <PipelineProgress
                  pipeline={pipelineBlock}
                  steps={pipelineData.steps}
                  historyEntries={entries}
                  omitHeader
                  flush
                />
              ) : (
                <div className={styles.placeholder}>
                  <p>
                    Pipeline progress (current stage and timing) will appear here once{" "}
                    <code className={styles.code}>GET /jobs/:id</code> includes the same pipeline
                    block as the job board. Tracked in GitHub issue #28.
                  </p>
                </div>
              )}
            </div>
          </div>

          {entries.length > 0 && (
            <div className={styles.panel}>
              <div className={styles.panelHead}>
                <span className={styles.panelTitle}>Time distribution by station</span>
              </div>
              <div className={styles.chartBody}>
                <JobJourneyChart entries={entries} />
              </div>
            </div>
          )}

          <div className={styles.panel}>
            <div className={styles.panelHead}>
              <span className={styles.panelTitle}>Event timeline</span>
            </div>
            <div className={styles.timelineBody}>
              {historyLoading && (
                <p className={styles.muted}>Loading history…</p>
              )}
              {historyError && (
                <p className={styles.errorText}>Failed to load history: {historyError.message}</p>
              )}
              {!historyLoading && !historyError && (
                <JobHistory job={job} embedded />
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
