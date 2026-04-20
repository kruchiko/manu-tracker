import { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import type { Job } from "../jobs.types";
import { useJob } from "../hooks/useJob";
import { useJobs } from "../hooks/useJobs";
import { parseJobsJobIdParam } from "../../../shared/navigation/pageRoutes";
import { JobDetailPage } from "./JobDetailPage";
import { JobsListView } from "./JobsListView";
import { NewJobManualView } from "./NewJobManualView";

type JobsView = "list" | "new" | "detail";

export function JobsPage() {
  const { jobId: jobIdParam } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const numericJobId = parseJobsJobIdParam(jobIdParam);
  const jobDetailReturnTo =
    searchParams.get("from") === "live-operations" ? "live-operations" : null;

  const [view, setView] = useState<JobsView>("list");
  const [detailJob, setDetailJob] = useState<Job | null>(null);
  const [printAfterDetailLoad, setPrintAfterDetailLoad] = useState(false);
  const [pendingPrintJobId, setPendingPrintJobId] = useState<number | null>(null);

  const jobsQuery = useJobs({ enabled: view === "list" });

  const jobFromList =
    numericJobId != null ? jobsQuery.data?.find((j) => j.id === numericJobId) : undefined;

  const bootstrapDetail = numericJobId != null && view === "list";
  const bootstrapJobQuery = useJob(numericJobId, {
    enabled: bootstrapDetail,
    placeholderData: jobFromList,
  });

  useEffect(() => {
    if (jobIdParam == null || jobIdParam === "") return;
    if (numericJobId != null) return;
    navigate("/jobs", { replace: true });
  }, [jobIdParam, numericJobId, navigate]);

  useEffect(() => {
    if (numericJobId != null) return;
    if (view !== "detail") return;
    queueMicrotask(() => {
      setDetailJob(null);
      setView("list");
      setPrintAfterDetailLoad(false);
    });
  }, [numericJobId, view]);

  useEffect(() => {
    if (numericJobId == null) return;
    if (view !== "list") return;
    if (bootstrapJobQuery.isError) {
      queueMicrotask(() => {
        setPendingPrintJobId(null);
        navigate("/jobs", { replace: true });
      });
      return;
    }
    const data = bootstrapJobQuery.data;
    if (!data || data.id !== numericJobId) return;
    queueMicrotask(() => {
      setDetailJob(data);
      setPrintAfterDetailLoad(pendingPrintJobId === data.id);
      setPendingPrintJobId(null);
      setView("detail");
    });
  }, [
    numericJobId,
    view,
    bootstrapJobQuery.data,
    bootstrapJobQuery.isError,
    navigate,
    pendingPrintJobId,
  ]);

  useEffect(() => {
    if (numericJobId == null || detailJob === null) return;
    if (detailJob.id === numericJobId) return;
    queueMicrotask(() => {
      setDetailJob(null);
      setView("list");
      setPrintAfterDetailLoad(false);
    });
  }, [numericJobId, detailJob]);

  const handleConsumedPrintIntent = useCallback(() => {
    setPrintAfterDetailLoad(false);
  }, []);

  if (view === "new") {
    return (
      <NewJobManualView
        onBack={() => {
          setView("list");
          navigate("/jobs", { replace: true });
        }}
        onCreated={(job) => {
          setDetailJob(job);
          setPrintAfterDetailLoad(false);
          setView("detail");
          navigate(`/jobs/${job.id}`, { replace: true });
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
            navigate("/live-operations");
            return;
          }
          navigate("/jobs");
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
        setPendingPrintJobId(null);
        navigate(`/jobs/${job.id}`);
      }}
      onPrintJob={(job) => {
        setPendingPrintJobId(job.id);
        navigate(`/jobs/${job.id}`);
      }}
    />
  );
}
