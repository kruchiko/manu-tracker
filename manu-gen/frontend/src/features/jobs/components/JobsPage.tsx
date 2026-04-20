import { useEffect, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { useJob } from "../hooks/useJob";
import { useJobs } from "../hooks/useJobs";
import {
  JOB_DETAIL_RETURN_FROM_LIVE_OPS,
  JOB_DETAIL_RETURN_FROM_PARAM,
  JOB_NEW_SEGMENT,
  jobDetailPath,
  jobNewPath,
  pagePath,
  parseJobsJobIdParam,
} from "../../../shared/navigation/pageRoutes";
import { JobDetailPage } from "./JobDetailPage";
import { JobsListView } from "./JobsListView";
import { NewJobManualView } from "./NewJobManualView";

export function JobsPage() {
  const { jobId: jobIdParam } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const numericJobId = parseJobsJobIdParam(jobIdParam);
  const jobDetailReturnTo =
    searchParams.get(JOB_DETAIL_RETURN_FROM_PARAM) === JOB_DETAIL_RETURN_FROM_LIVE_OPS
      ? "live-operations"
      : null;

  const [pendingPrintJobId, setPendingPrintJobId] = useState<number | null>(null);

  const isNew = jobIdParam === JOB_NEW_SEGMENT;
  const isDetail = numericJobId != null;
  const isList = !isDetail && !isNew;

  const jobsQuery = useJobs({ enabled: isList });

  const jobFromList =
    numericJobId != null ? jobsQuery.data?.find((j) => j.id === numericJobId) : undefined;

  const detailQuery = useJob(numericJobId, {
    enabled: isDetail,
    placeholderData: jobFromList,
  });

  useEffect(() => {
    if (jobIdParam == null || jobIdParam === "") return;
    if (numericJobId != null) return;
    if (jobIdParam === JOB_NEW_SEGMENT) return;
    navigate(pagePath("jobs"), { replace: true });
  }, [jobIdParam, numericJobId, navigate]);

  useEffect(() => {
    if (!isDetail) return;
    if (detailQuery.isError) {
      navigate(pagePath("jobs"), { replace: true });
    }
  }, [isDetail, detailQuery.isError, navigate]);

  const printAfterMount =
    isDetail &&
    detailQuery.data != null &&
    pendingPrintJobId === detailQuery.data.id;

  function handleConsumedPrintIntent(): void {
    setPendingPrintJobId(null);
  }

  if (isNew) {
    return (
      <NewJobManualView
        onBack={() => {
          navigate(pagePath("jobs"));
        }}
        onCreated={(job) => {
          setPendingPrintJobId(null);
          navigate(jobDetailPath(job.id), { replace: true });
        }}
      />
    );
  }

  if (isDetail && detailQuery.data) {
    const backToLiveOps = jobDetailReturnTo === "live-operations";

    return (
      <JobDetailPage
        key={`${detailQuery.data.id}-${printAfterMount}`}
        job={detailQuery.data}
        backLabel={backToLiveOps ? "Live Operations" : "Jobs"}
        backAriaLabel={backToLiveOps ? "Back to Live Operations" : undefined}
        onBack={() => {
          setPendingPrintJobId(null);
          if (backToLiveOps) {
            navigate(pagePath("live-operations"));
            return;
          }
          navigate(pagePath("jobs"));
        }}
        printAfterMount={printAfterMount}
        onConsumedPrintIntent={handleConsumedPrintIntent}
      />
    );
  }

  return (
    <JobsListView
      jobs={jobsQuery.data}
      jobsLoading={jobsQuery.isLoading || (isDetail && detailQuery.isLoading)}
      jobsError={jobsQuery.error}
      onCreateManual={() => {
        navigate(jobNewPath());
      }}
      onViewJob={(job) => {
        setPendingPrintJobId(null);
        navigate(jobDetailPath(job.id));
      }}
      onPrintJob={(job) => {
        setPendingPrintJobId(job.id);
        navigate(jobDetailPath(job.id));
      }}
    />
  );
}
