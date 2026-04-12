import type { ReactNode } from "react";
import styles from "./ListCard.module.css";

interface ListCardProps {
  title: string;
  count: number;
  countLabel: string;
  children: ReactNode;
}

export function ListCard({ title, count, countLabel, children }: ListCardProps): React.JSX.Element {
  return (
    <div className={styles.root}>
      <div className={styles.header}>
        <span className={styles.title}>{title}</span>
        <span className={styles.count}>
          {count} {countLabel}
        </span>
      </div>
      {children}
    </div>
  );
}
