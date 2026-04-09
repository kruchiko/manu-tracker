import { useState } from "react";
import { DataTable, type Column } from "../../../shared/components/DataTable";
import { useDeleteStation } from "../hooks/useDeleteStation";
import type { Station } from "../stations.types";

interface StationTableProps {
  stations: Station[];
}

function SlotCapacityCell({ count }: { count: number }): React.JSX.Element {
  const display = Math.min(Math.max(count, 1), 15);
  return (
    <div className="flex items-center gap-[7px]">
      <div className="flex gap-[3px]">
        {Array.from({ length: display }).map((_, i) => (
          <div
            key={i}
            className="size-[9px] rounded-[2px] border border-accent-muted bg-accent-light"
          />
        ))}
      </div>
      <span className="font-mono text-[11px] text-text-muted">
        {display} {display === 1 ? "slot" : "slots"}
      </span>
    </div>
  );
}

function CameraBadge({ eyeId }: { eyeId: string | null }): React.JSX.Element {
  if (eyeId) {
    return (
      <span className="inline-flex items-center gap-[5px] whitespace-nowrap rounded-[var(--radius-sm)] bg-status-ok-bg px-[9px] py-[3px] font-mono text-[11px] text-status-ok">
        <span className="block size-[5px] shrink-0 rounded-full bg-status-ok" />
        {eyeId}
      </span>
    );
  }
  return (
    <span className="inline-flex items-center whitespace-nowrap rounded-[var(--radius-sm)] border border-dashed border-border-strong bg-surface-2 px-[9px] py-[3px] font-mono text-[11px] text-text-disabled">
      No camera
    </span>
  );
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

  const btnGhost =
    "inline-flex h-[28px] items-center gap-[6px] rounded-[var(--radius-md)] border border-transparent px-[10px] font-body text-[12px] font-medium transition-all duration-[var(--duration-fast)]";

  if (confirmDelete) {
    return (
      <div className="flex min-w-[130px] items-center justify-end gap-[4px]">
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); handleDelete(); }}
          disabled={deleteStation.isPending}
          className={`${btnGhost} text-status-late hover:bg-status-late-bg disabled:opacity-60`}
        >
          {deleteStation.isPending ? "Deleting..." : "Confirm"}
        </button>
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); setConfirmDelete(false); setDeleteError(null); }}
          className={`${btnGhost} text-text-muted hover:bg-surface-2 hover:text-text`}
        >
          Cancel
        </button>
      </div>
    );
  }

  if (deleteError) {
    return (
      <div className="flex min-w-[130px] items-center justify-end gap-[4px]">
        <span className="max-w-[200px] truncate text-[11px] text-status-late" title={deleteError}>
          {deleteError}
        </span>
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); setDeleteError(null); }}
          className={`${btnGhost} text-text-muted hover:bg-surface-2 hover:text-text`}
        >
          OK
        </button>
      </div>
    );
  }

  return (
    <div className="flex min-w-[130px] items-center justify-end gap-[4px]">
      <button
        type="button"
        onClick={(e) => e.stopPropagation()}
        className={`${btnGhost} text-text-muted hover:bg-surface-2 hover:text-text`}
      >
        Edit
      </button>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          handleDelete();
        }}
        className={`${btnGhost} text-status-late hover:bg-status-late-bg`}
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
        <span className="text-[14px] font-semibold text-text">
          {station.name}
        </span>
      ),
    },
    {
      key: "location",
      header: "Location",
      render: (station) => (
        <span className="text-[13px] text-text-secondary">
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
