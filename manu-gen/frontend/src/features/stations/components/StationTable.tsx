import { useState } from "react";
import { DataTable, type Column } from "../../../shared/components/DataTable";
import { useDeleteStation } from "../hooks/useDeleteStation";
import type { Station } from "../stations.types";
import styles from "./StationTable.module.css";

interface StationTableProps {
  stations: Station[];
}

function SlotCapacityCell({ count }: { count: number }): React.JSX.Element {
  const display = Math.min(Math.max(count, 1), 15);
  return (
    <div className={styles.slotRow}>
      <div className={styles.slotDots}>
        {Array.from({ length: display }).map((_, i) => (
          <div key={i} className={styles.slotDot} />
        ))}
      </div>
      <span className={styles.slotLabel}>
        {display} {display === 1 ? "slot" : "slots"}
      </span>
    </div>
  );
}

function CameraBadge({ eyeId }: { eyeId: string | null }): React.JSX.Element {
  if (eyeId) {
    return (
      <span className={styles.badgeOk}>
        <span className={styles.badgeDot} />
        {eyeId}
      </span>
    );
  }
  return <span className={styles.badgeNone}>No camera</span>;
}

function ActionsCell({ station }: { station: Station }): React.JSX.Element {
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const deleteStation = useDeleteStation();

  function handleDelete(): void {
    if (!confirmDelete) {
      setDeleteError(null);
      setConfirmDelete(true);
      return;
    }
    deleteStation.mutate(station.id, {
      onError: (err) => {
        setDeleteError(err instanceof Error ? err.message : "Delete failed");
        setConfirmDelete(false);
      },
    });
  }

  if (confirmDelete) {
    return (
      <div className={styles.actionsRow}>
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); handleDelete(); }}
          disabled={deleteStation.isPending}
          className={`${styles.btnGhost} ${styles.btnDanger}`}
        >
          {deleteStation.isPending ? "Deleting..." : "Confirm"}
        </button>
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); setConfirmDelete(false); setDeleteError(null); }}
          className={`${styles.btnGhost} ${styles.btnMuted}`}
        >
          Cancel
        </button>
      </div>
    );
  }

  if (deleteError) {
    return (
      <div className={styles.actionsRow}>
        <span className={styles.errorTruncate} title={deleteError}>
          {deleteError}
        </span>
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); setDeleteError(null); }}
          className={`${styles.btnGhost} ${styles.btnMuted}`}
        >
          OK
        </button>
      </div>
    );
  }

  return (
    <div className={styles.actionsRow}>
      <button
        type="button"
        onClick={(e) => e.stopPropagation()}
        className={`${styles.btnGhost} ${styles.btnMuted}`}
      >
        Edit
      </button>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          handleDelete();
        }}
        className={`${styles.btnGhost} ${styles.btnDanger}`}
        aria-label={`Delete station ${station.name}`}
      >
        Delete
      </button>
    </div>
  );
}

export function StationTable({ stations }: StationTableProps): React.JSX.Element {
  const columns: Column<Station>[] = [
    {
      key: "name",
      header: "Station",
      render: (station) => (
        <span className={styles.stationName}>{station.name}</span>
      ),
    },
    {
      key: "location",
      header: "Location",
      render: (station) => (
        <span className={styles.stationLocation}>
          {station.location || "\u2014"}
        </span>
      ),
    },
    {
      key: "slotCapacity",
      header: "Slot capacity",
      render: (station) => <SlotCapacityCell count={station.slotCapacity ?? 1} />,
    },
    {
      key: "camera",
      header: "Camera",
      render: (station) => <CameraBadge eyeId={station.eyeId} />,
    },
    {
      key: "actions",
      header: "Actions",
      align: "right",
      render: (station) => <ActionsCell station={station} />,
    },
  ];

  return (
    <DataTable
      columns={columns}
      rows={stations}
      getRowKey={(station) => station.id}
    />
  );
}
