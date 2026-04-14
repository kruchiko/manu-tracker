import { useMemo, useState } from "react";
import { Plus } from "lucide-react";
import { PageHeader } from "../../../shared/components/PageHeader";
import type { Job } from "../jobs.types";
import { JobList, type JobsTableFilter } from "./JobList";
import { JobsFallbackNote } from "./JobsFallbackNote";
import { filterJobsByTab } from "./jobListFilters";
import { JOB_STATUS_FILTER_ORDER, JOB_STATUS_LABEL } from "./jobStatusLabels";
import styles from "./JobsListView.module.css";

const TABS: { id: JobsTableFilter; label: string }[] = [
  { id: "all", label: "All" },
  ...JOB_STATUS_FILTER_ORDER.map((id) => ({
    id,
    label: JOB_STATUS_LABEL[id],
  })),
];

interface JobsListViewProps {
  jobs: Job[] | undefined;
  jobsLoading: boolean;
  jobsError: unknown;
  onCreateManual: () => void;
  onViewJob: (job: Job) => void;
  onPrintJob: (job: Job) => void;
}

export function JobsListView({
  jobs,
  jobsLoading,
  jobsError,
  onCreateManual,
  onViewJob,
  onPrintJob,
}: JobsListViewProps) {
  const [filter, setFilter] = useState<JobsTableFilter>("all");

  const hasData = jobs !== undefined;

  const filteredCount = useMemo(
    () => (hasData ? filterJobsByTab(jobs, filter).length : null),
    [hasData, jobs, filter],
  );

  return (
    <div className={styles.page}>
      <div className={styles.printHide}>
        <PageHeader
          title="Jobs"
          subtitle="Floor-level tracking units — one per product type per order"
          action={
            <button type="button" className={styles.primaryBtn} onClick={onCreateManual}>
              <Plus size={12} strokeWidth={2} aria-hidden />
              Create Job manually
            </button>
          }
        />

        <JobsFallbackNote />

        <div className={styles.listCard}>
          <div className={styles.listCardHead}>
            <span className={styles.listCardTitle}>All Jobs</span>
            <div className={styles.listCardToolbar}>
              <div className={styles.segments} role="group" aria-label="Filter jobs by status">
                {TABS.map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    aria-pressed={filter === tab.id}
                    className={`${styles.segment} ${filter === tab.id ? styles.segmentActive : ""}`}
                    onClick={() => setFilter(tab.id)}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
              <span className={styles.count}>
                {filteredCount !== null
                  ? `${filteredCount} ${filteredCount === 1 ? "job" : "jobs"}`
                  : "— jobs"}
              </span>
            </div>
          </div>

          <JobList
            jobs={jobs}
            jobsLoading={jobsLoading}
            jobsError={jobsError}
            filter={filter}
            onViewJob={onViewJob}
            onPrintJob={onPrintJob}
            onShowAllJobs={() => setFilter("all")}
          />
        </div>
      </div>
    </div>
  );
}
