import { useCallback, useState } from "react";
import type { Job } from "../jobs.types";
import { useJobs } from "../hooks/useJobs";
import { JobDetailPage } from "./JobDetailPage";
import { JobsListView } from "./JobsListView";
import { NewJobManualView } from "./NewJobManualView";

type JobsView = "list" | "new" | "detail";

export function JobsPage() {
  const [view, setView] = useState<JobsView>("list");
  const [detailJob, setDetailJob] = useState<Job | null>(null);
  const [printAfterDetailLoad, setPrintAfterDetailLoad] = useState(false);

  const jobsQuery = useJobs({ enabled: view === "list" });

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
    return (
      <JobDetailPage
        key={`${detailJob.id}-${printAfterDetailLoad}`}
        job={detailJob}
        onBack={() => {
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
