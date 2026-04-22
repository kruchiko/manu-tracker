import { useEffect, useRef } from "react";
import type { UseQueryResult } from "@tanstack/react-query";
import { JobBoardRow } from "./JobBoardRow";
import type { BoardJob } from "../dashboard.types";
import styles from "./JobBoard.module.css";

interface JobBoardProps {
  onSelectJob: (job: BoardJob) => void;
  boardQuery: UseQueryResult<BoardJob[], Error>;
}

export function JobBoard({ onSelectJob, boardQuery }: JobBoardProps) {
  const { data, isLoading, error } = boardQuery;
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [data]);

  if (isLoading) {
    return <p className={styles.loading}>Loading job board...</p>;
  }

  if (error) {
    return <p className={styles.error}>Failed to load job board: {error.message}</p>;
  }

  const jobs = data ?? [];

  if (jobs.length === 0) {
    return <p className={styles.empty}>No jobs yet.</p>;
  }

  return (
    <div ref={scrollRef} className={styles.scroll}>
      <table className={styles.table} role="grid">
        <thead className={styles.thead}>
          <tr className={styles.headerRow}>
            <th className={styles.th}>Job</th>
            <th className={styles.th}>Product</th>
            <th className={styles.th}>Status</th>
            <th className={styles.th}>Pipeline</th>
            <th className={styles.th}>Progress</th>
            <th className={styles.th}>Current Station</th>
            <th className={styles.th}>Time at Station</th>
            <th className={`${styles.th} ${styles.thLast}`}>Last Seen</th>
          </tr>
        </thead>
        <tbody>
          {jobs.map((job) => (
            <JobBoardRow key={job.id} job={job} onSelect={onSelectJob} />
          ))}
        </tbody>
      </table>
    </div>
  );
}
