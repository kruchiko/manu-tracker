import styles from "./JobsFallbackNote.module.css";

export function JobsFallbackNote(): React.JSX.Element {
  return (
    <div className={styles.root}>
      <svg
        className={styles.icon}
        width={14}
        height={14}
        viewBox="0 0 16 16"
        fill="none"
        stroke="var(--accent)"
        strokeWidth={1.5}
        aria-hidden
      >
        <circle cx={8} cy={8} r={6} />
        <path d="M8 5v4M8 10.5v.5" />
      </svg>
      <div className={styles.text}>
        Jobs are created automatically when a Customer Order is saved — one per line item. Use{" "}
        <strong>Create Job manually</strong> only as a fallback if a job needs to be created outside
        the order flow.
      </div>
    </div>
  );
}
