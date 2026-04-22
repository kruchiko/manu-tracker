import { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { Printer } from "lucide-react";
import { ConfirmDialog } from "../../../shared/components/ConfirmDialog";
import { ScreenHeader } from "../../../shared/components/ScreenHeader";
import screenHeaderStyles from "../../../shared/components/ScreenHeader.module.css";
import { usePipeline } from "../../pipelines/hooks/usePipeline";
import { JobJourneyChart } from "./JobJourneyChart";
import { JobHistory } from "./JobHistory";
import { JobDetailKpis } from "./JobDetailKpis";
import { PipelineProgress } from "./PipelineProgress";
import { countCompletedSteps } from "./pipelineProgress.utils";
import { QrPreview } from "./QrPreview";
import { JobStatusBadge } from "./JobStatusBadge";
import { useJobHistory } from "../hooks/useJobHistory";
import { useDeleteJob } from "../hooks/useDeleteJob";
import { customerOrderDetailUrl } from "../../../shared/navigation/pageRoutes";
import type { Job } from "../jobs.types";
import { computeJobJourneyStats } from "../utils/jobJourneyStats";
import styles from "./JobDetailPage.module.css";

interface JobDetailPageProps {
  job: Job;
  onBack: () => void;
  /** Visible label after the chevron (e.g. "Jobs" or "Live Operations"). */
  backLabel?: string;
  /** Overrides default `aria-label` ("Back to {backLabel}"). */
  backAriaLabel?: string;
  /** When true, open the print dialog after the QR preview is ready (e.g. Print Label from list). */
  printAfterMount?: boolean;
  onConsumedPrintIntent?: () => void;
}

export function JobDetailPage({
  job,
  onBack,
  backLabel = "Jobs",
  backAriaLabel,
  printAfterMount = false,
  onConsumedPrintIntent,
}: JobDetailPageProps) {
  const { data: pipelineData } = usePipeline(job.pipelineId);
  const { data: historyData, isLoading: historyLoading, error: historyError } = useJobHistory(job.id);
  const entries = historyData ?? [];
  const stats = computeJobJourneyStats(entries);
  const pipelineBlock = job.pipeline;
  const allocations = job.allocations ?? [];

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

  const completedCount =
    pipelineBlock && pipelineData?.steps?.length
      ? countCompletedSteps(pipelineData.steps, pipelineBlock.stepPosition, entries)
      : 0;

  const stationsHint =
    pipelineBlock && pipelineData?.steps?.length
      ? `${completedCount} of ${pipelineBlock.totalSteps} stations`
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

      <ScreenHeader
        className={styles.hideOnPrint}
        layout="detailToolbar"
        variant="detailBand"
        backLabel={backLabel}
        backAriaLabel={backAriaLabel}
        onBack={onBack}
        title={
          <div className={styles.toolbarIdentity}>
            <p className={styles.toolbarEyebrow}>
              {job.jobNumber} · {job.trayCode}
            </p>
            <h1 className={styles.toolbarProductTitle}>{job.productType}</h1>
          </div>
        }
        actions={
          <button
            type="button"
            className={`${screenHeaderStyles.ghostToolbarBtn} ${styles.toolbarPrintBtn}`}
            onClick={() => window.print()}
          >
            <Printer size={11} strokeWidth={1.5} aria-hidden />
            Print Label
          </button>
        }
      />

      <div className={styles.grid}>
        <div className={styles.leftCol}>
          <div className={`${styles.metaGrid} ${styles.hideOnPrint}`}>
            <div className={styles.metaCell}>
              <div className={styles.metaLabel}>Customer orders</div>
              {allocations.length === 0 ? (
                <div className={styles.metaValueMuted}>None — manual job</div>
              ) : (
                <ul className={styles.metaAllocList}>
                  {allocations.map((a) => (
                    <li key={a.id}>
                      <Link
                        className={styles.metaOrderLink}
                        to={customerOrderDetailUrl(a.customerOrderId)}
                      >
                        {a.orderNumber}
                      </Link>
                      <span className={styles.metaAllocMeta}>
                        {" "}
                        · {a.customerName} · {a.quantity} pcs
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            {job.availableToAllocate !== undefined && (
              <div className={styles.metaCell}>
                <div className={styles.metaLabel}>Available to allocate</div>
                <div className={styles.metaValue}>{job.availableToAllocate} pcs</div>
              </div>
            )}
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
              <div className={styles.metaValueMono}>{job.trayCode}</div>
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
                Attach this label to the physical tray before the first station scan.
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
                    Pipeline layout could not be loaded (steps missing). Open Pipelines to verify
                    this job&apos;s pipeline definition.
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
