import { PackageOpen } from "lucide-react";
import { useStations } from "../hooks/useStations";
import { ListCard } from "../../../shared/components/ListCard";
import { StationTable } from "./StationTable";
import type { Station } from "../stations.types";
import styles from "./StationList.module.css";

function SkeletonRow({ hasBorder }: { hasBorder: boolean }): React.JSX.Element {
  return (
    <div className={`${styles.skeletonRow} ${hasBorder ? styles.skeletonRowBorder : ""}`}>
      <div className={styles.skeleton} style={{ width: 96 }} />
      <div className={styles.skeleton} style={{ width: 144 }} />
      <div className={styles.skeleton} style={{ width: 64 }} />
      <div className={styles.skeleton} style={{ width: 64 }} />
      <div className={styles.skeleton} style={{ width: 96, marginLeft: "auto" }} />
    </div>
  );
}

function LoadingSkeleton(): React.JSX.Element {
  return (
    <div className={styles.skeletonCard}>
      <div className={styles.skeletonHeader}>
        <div className={styles.skeleton} style={{ width: 112 }} />
        <div className={styles.skeleton} style={{ width: 64, height: 12 }} />
      </div>
      <div className={styles.skeletonTableHeader}>
        <div className={styles.skeletonSmall} style={{ width: 64 }} />
        <div className={styles.skeletonSmall} style={{ width: 64 }} />
        <div className={styles.skeletonSmall} style={{ width: 80 }} />
        <div className={styles.skeletonSmall} style={{ width: 56 }} />
        <div className={styles.skeletonSmall} style={{ width: 56, marginLeft: "auto" }} />
      </div>
      {Array.from({ length: 5 }).map((_, i) => (
        <SkeletonRow key={i} hasBorder={i < 4} />
      ))}
    </div>
  );
}

interface StationListProps {
  onSelectStation?: (station: Station) => void;
}

export function StationList({ onSelectStation }: StationListProps): React.JSX.Element {
  const { data, isLoading, error } = useStations();

  if (isLoading) {
    return <LoadingSkeleton />;
  }

  if (error) {
    return (
      <div className={`${styles.stateCard} ${styles.errorCard}`}>
        <p className={styles.errorText}>
          Failed to load stations: {error.message}
        </p>
      </div>
    );
  }

  const stations = data ?? [];

  if (stations.length === 0) {
    return (
      <div className={`${styles.stateCard} ${styles.emptyCard}`}>
        <PackageOpen size={40} strokeWidth={1.5} className={styles.emptyIcon} />
        <p className={styles.emptyText}>
          No stations yet. Create one to get started.
        </p>
      </div>
    );
  }

  return (
    <ListCard
      title="All Stations"
      count={stations.length}
      countLabel={stations.length === 1 ? "station" : "stations"}
    >
      <StationTable stations={stations} onSelectStation={onSelectStation} />
    </ListCard>
  );
}
