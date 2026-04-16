import { useCallback, useEffect, useState } from "react";
import type { Job } from "../jobs.types";
import { useJob } from "../hooks/useJob";
import { useJobs } from "../hooks/useJobs";
import { JobDetailPage } from "./JobDetailPage";
import { JobsListView } from "./JobsListView";
import { NewJobManualView } from "./NewJobManualView";

type JobsView = "list" | "new" | "detail";

export interface JobsPageProps {
  /** When set (e.g. from Live Operations), fetch and open this job in detail view once. */
  initialDetailJobId?: number | null;
  /** Called after opening detail from `initialDetailJobId` so the parent can clear pending state. */
  onInitialDetailConsumed?: () => void;
  /**
   * When `'live-operations'`, Job Detail back exits to Live Operations instead of the Jobs list.
   * Omit or `null` when the user opened detail from within Jobs (list / create / print).
   */
  jobDetailReturnTo?: "live-operations" | null;
  /** Invoked when leaving detail back to Live Operations (sidebar + return target are updated in App). */
  onExitJobDetailToLiveOperations?: () => void;
}

export function JobsPage({
  initialDetailJobId = null,
  onInitialDetailConsumed,
  jobDetailReturnTo = null,
  onExitJobDetailToLiveOperations,
}: JobsPageProps = {}) {
  const [view, setView] = useState<JobsView>("list");
  const [detailJob, setDetailJob] = useState<Job | null>(null);
  const [printAfterDetailLoad, setPrintAfterDetailLoad] = useState(false);

  const jobsQuery = useJobs({ enabled: view === "list" });

  const bootstrapDetail = initialDetailJobId != null && view === "list";
  const bootstrapJobQuery = useJob(initialDetailJobId, {
    enabled: bootstrapDetail,
  });

  useEffect(() => {
    if (initialDetailJobId == null) return;
    if (view !== "list") return;
    if (bootstrapJobQuery.isError) {
      onInitialDetailConsumed?.();
      return;
    }
    const data = bootstrapJobQuery.data;
    if (!data || data.id !== initialDetailJobId) return;
    queueMicrotask(() => {
      setDetailJob(data);
      setPrintAfterDetailLoad(false);
      setView("detail");
      onInitialDetailConsumed?.();
    });
  }, [
    initialDetailJobId,
    view,
    bootstrapJobQuery.data,
    bootstrapJobQuery.isError,
    onInitialDetailConsumed,
  ]);

  const handleConsumedPrintIntent = useCallback(() => {
    setPrintAfterDetailLoad(false);
  }, []);

  if (view === "new") {
    return (
      <NewJobManualView
        onBack={() => setView("list")}
        onCreated={(job) => {
          setDetailJob(job);
          setPrintAfterDetailLoad(false);
          setView("detail");
        }}
      />
    );
  }

  if (view === "detail" && detailJob !== null) {
    const backToLiveOps = jobDetailReturnTo === "live-operations";

    return (
      <JobDetailPage
        key={`${detailJob.id}-${printAfterDetailLoad}`}
        job={detailJob}
        backLabel={backToLiveOps ? "Live Operations" : "Jobs"}
        backAriaLabel={backToLiveOps ? "Back to Live Operations" : undefined}
        onBack={() => {
          if (backToLiveOps) {
            onExitJobDetailToLiveOperations?.();
            return;
          }
          setDetailJob(null);
          setPrintAfterDetailLoad(false);
          setView("list");
        }}
        printAfterMount={printAfterDetailLoad}
        onConsumedPrintIntent={handleConsumedPrintIntent}
      />
    );
  }

  return (
    <JobsListView
      jobs={jobsQuery.data}
      jobsLoading={jobsQuery.isLoading}
      jobsError={jobsQuery.error}
      onCreateManual={() => setView("new")}
      onViewJob={(job) => {
        setDetailJob(job);
        setPrintAfterDetailLoad(false);
        setView("detail");
      }}
      onPrintJob={(job) => {
        setDetailJob(job);
        setPrintAfterDetailLoad(true);
        setView("detail");
      }}
    />
  );
}
