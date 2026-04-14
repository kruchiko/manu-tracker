import { useState } from "react";
import { ConfirmDialog } from "../../../shared/components/ConfirmDialog";
import { useDeleteStation } from "../hooks/useDeleteStation";
import type { Station } from "../stations.types";
import styles from "./StationForm.module.css";

interface StationEditDangerZoneProps {
  station: Station;
  onDeleted: () => void;
}

export function StationEditDangerZone({
  station,
  onDeleted,
}: StationEditDangerZoneProps): React.JSX.Element {
  const deleteStation = useDeleteStation();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  return (
    <>
      <div className={styles.dangerZone}>
        <div className={styles.dangerZoneLabel}>Danger zone</div>
        <div className={styles.dangerZoneCard}>
          <div>
            <div className={styles.dangerZoneTitle}>Delete this station</div>
            <p className={styles.dangerZoneBody}>
              Permanently removes {station.name} and its scan history. This cannot be undone.
              Pipelines referencing this station will need to be updated.
            </p>
            {deleteError && <p className={styles.dangerError}>{deleteError}</p>}
          </div>
          <button
            type="button"
            className={styles.dangerButton}
            disabled={deleteStation.isPending}
            onClick={() => {
              setDeleteError(null);
              setConfirmOpen(true);
            }}
          >
            Delete station
          </button>
        </div>
      </div>

      <ConfirmDialog
        open={confirmOpen}
        title="Delete this station?"
        message={`This will permanently delete “${station.name}” and related scan history.`}
        confirmLabel="Delete"
        onConfirm={() => {
          deleteStation.mutate(station.id, {
            onSuccess: () => {
              setConfirmOpen(false);
              onDeleted();
            },
            onError: (err) => {
              setDeleteError(err instanceof Error ? err.message : "Delete failed");
              setConfirmOpen(false);
            },
          });
        }}
        onCancel={() => setConfirmOpen(false)}
      />
    </>
  );
}
