import { PackageOpen, Printer } from "lucide-react";
import type { Job, JobStatus } from "../jobs.types";
import { filterJobsByTab, type JobsTableFilter } from "./jobListFilters";
import { filteredEmptyHeadline, JOB_STATUS_LABEL } from "./jobStatusLabels";
import { JobStatusBadge } from "./JobStatusBadge";
import styles from "./JobList.module.css";

export type { JobsTableFilter };

function jobsErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (typeof error === "string") return error;
  return "Unknown error";
}

interface JobListProps {
  jobs: Job[] | undefined;
  jobsLoading: boolean;
  jobsError: unknown;
  filter: JobsTableFilter;
  onViewJob: (job: Job) => void;
  onPrintJob: (job: Job) => void;
  /** Resets the status filter to “All” when the tab hides every job. Jobs list page should pass this. */
  onShowAllJobs?: () => void;
}

export function JobList({
  jobs: jobsData,
  jobsLoading,
  jobsError,
  filter,
  onViewJob,
  onPrintJob,
  onShowAllJobs,
}: JobListProps) {
  /**
   * Error takes priority over loading so the user sees the failure, even during a refetch
   * (TanStack Query can keep a stale error while `isFetching` is true). This is intentional:
   * we prefer showing "Failed" + retry over masking errors behind a spinner.
   */
  if (jobsError) {
    return (
      <p className={styles.error}>Failed to load jobs: {jobsErrorMessage(jobsError)}</p>
    );
  }

  if (jobsLoading || jobsData === undefined) {
    return <p className={styles.loading}>Loading jobs…</p>;
  }

  const jobs = filterJobsByTab(jobsData, filter);

  if (jobsData.length === 0) {
    return (
      <div className={styles.emptyState} role="status" aria-live="polite">
        <PackageOpen size={40} strokeWidth={1.5} className={styles.emptyIcon} aria-hidden />
        <h2 className={styles.emptyHeading}>No jobs yet</h2>
        <p className={styles.emptyText}>
          Jobs are created when you save a customer order—one per line item. Use{" "}
          <strong className={styles.emptyStrong}>Create Job manually</strong> in the page header only
          if you need a job outside the order flow.
        </p>
      </div>
    );
  }

  /** Jobs exist, but the status tab excludes every row (`filter` cannot be `"all"` here). */
  if (jobs.length === 0) {
    if (filter === "all") {
      if (import.meta.env.DEV) {
        console.error(
          "[JobList] Invariant violated: empty filtered list with filter “all” while jobs exist.",
        );
      }
      return (
        <p className={styles.error} role="alert">
          Unable to display the job list. Try refreshing the page.
        </p>
      );
    }

    const status: JobStatus = filter;
    const totalJobs = jobsData.length;
    const statusLabel = JOB_STATUS_LABEL[status];

    return (
      <div className={styles.emptyState} role="status" aria-live="polite">
        <PackageOpen size={40} strokeWidth={1.5} className={styles.emptyIcon} aria-hidden />
        <h2 className={styles.emptyHeading}>{filteredEmptyHeadline(status)}</h2>
        <p className={styles.emptyText}>
          You have {totalJobs} {totalJobs === 1 ? "job" : "jobs"}, but none are{" "}
          <strong className={styles.emptyStrong}>{statusLabel}</strong> right now. Try another tab
          {onShowAllJobs ? ", or view all jobs." : "."}
        </p>
        {onShowAllJobs && (
          <div className={styles.emptyActions}>
            <button type="button" className={styles.emptyCta} onClick={onShowAllJobs}>
              View all jobs
            </button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className={styles.scroll}>
      <table className={styles.table}>
        <thead>
          <tr>
            <th className={styles.th}>Job #</th>
            <th className={styles.th}>Product type</th>
            <th className={styles.th}>Order</th>
            <th className={styles.th}>Pipeline</th>
            <th className={styles.th}>Qty</th>
            <th className={styles.th}>Tray</th>
            <th className={styles.th}>Status</th>
            <th className={`${styles.th} ${styles.thActions}`}>Print</th>
          </tr>
        </thead>
        <tbody>
          {jobs.map((job) => (
            <tr
              key={job.id}
              className={`${styles.row} ${styles.rowClickable}`}
              tabIndex={0}
              aria-label={`Open job ${job.jobNumber}`}
              onClick={() => onViewJob(job)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  onViewJob(job);
                }
              }}
            >
              <td className={`${styles.td} ${styles.mono} ${styles.jobNumber}`}>{job.jobNumber}</td>
              <td className={`${styles.td} ${styles.productCell}`}>
                <strong className={styles.productStrong}>{job.productType}</strong>
              </td>
              <td className={`${styles.td} ${styles.mono}`}>
                <span className={styles.dash}>—</span>
              </td>
              <td className={`${styles.td} ${styles.muted}`}>{job.pipelineName}</td>
              <td className={`${styles.td} ${styles.monoQty}`}>{job.quantity}</td>
              <td className={`${styles.td} ${styles.mono}`}>{job.trayCode}</td>
              <td className={styles.td}>
                <JobStatusBadge status={job.status} />
              </td>
              <td className={`${styles.td} ${styles.actionsCell}`}>
                <div className={styles.actions}>
                  <button
                    type="button"
                    className={styles.printBtn}
                    onClick={(e) => {
                      e.stopPropagation();
                      onPrintJob(job);
                    }}
                  >
                    <Printer size={11} strokeWidth={1.5} aria-hidden />
                    Print Label
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
