import { Printer } from "lucide-react";
import type { Job } from "../jobs.types";
import { filterJobsByTab, type JobsTableFilter } from "./jobListFilters";
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
}

export function JobList({
  jobs: jobsData,
  jobsLoading,
  jobsError,
  filter,
  onViewJob,
  onPrintJob,
}: JobListProps) {
  if (jobsLoading) {
    return <p className={styles.loading}>Loading jobs…</p>;
  }

  if (jobsError) {
    return (
      <p className={styles.error}>Failed to load jobs: {jobsErrorMessage(jobsError)}</p>
    );
  }

  const jobs = filterJobsByTab(jobsData ?? [], filter);

  if ((jobsData ?? []).length === 0) {
    return <p className={styles.empty}>No jobs yet. Create one with Create Job manually.</p>;
  }

  if (jobs.length === 0) {
    return (
      <p className={styles.empty}>No jobs match this filter. Try another tab or clear the filter.</p>
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
            <th className={`${styles.th} ${styles.thActions}`}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {jobs.map((job) => (
            <tr key={job.id} className={styles.row}>
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
                    onClick={() => onPrintJob(job)}
                  >
                    <Printer size={11} strokeWidth={1.5} aria-hidden />
                    Print Label
                  </button>
                  <button
                    type="button"
                    className={styles.viewBtn}
                    onClick={() => onViewJob(job)}
                  >
                    View
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
