import { useState } from "react";
import type { Station } from "../stations.types";
import { useAssignEye } from "../hooks/useAssignEye";
import { useUnassignEye } from "../hooks/useUnassignEye";
import { useDeleteStation } from "../hooks/useDeleteStation";
import { useUpdateStation } from "../hooks/useUpdateStation";

function deriveThreshold(seconds: number | null): string {
  return seconds !== null ? String(seconds / 60) : "";
}

interface StationCardProps {
  station: Station;
}

export function StationCard({ station }: StationCardProps) {
  const [eyeInput, setEyeInput] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [dirtyThreshold, setDirtyThreshold] = useState<string | null>(null);

  const thresholdInput = dirtyThreshold ?? deriveThreshold(station.maxDurationSeconds);

  const assignEye = useAssignEye();
  const unassignEye = useUnassignEye();
  const deleteStation = useDeleteStation();
  const updateStation = useUpdateStation();

  function handleAssign(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = eyeInput.trim();
    if (trimmed.length === 0) return;
    assignEye.mutate(
      { stationId: station.id, eyeId: trimmed },
      { onSuccess: () => setEyeInput("") },
    );
  }

  function handleUnassign() {
    unassignEye.mutate(station.id);
  }

  function handleDelete() {
    if (!confirmDelete) {
      setConfirmDelete(true);
      return;
    }
    deleteStation.mutate(station.id, {
      onError: () => setConfirmDelete(false),
    });
  }

  function handleThreshold(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = thresholdInput.trim();
    const minutes = trimmed === "" ? null : Number(trimmed);
    if (minutes !== null && (isNaN(minutes) || minutes <= 0)) return;
    setDirtyThreshold(null);
    updateStation.mutate({
      stationId: station.id,
      maxDurationSeconds: minutes !== null ? Math.round(minutes * 60) : null,
    });
  }

  const mutationError =
    assignEye.error ?? unassignEye.error ?? deleteStation.error ?? updateStation.error;

  return (
    <div className="rounded-lg border bg-white p-5 shadow-sm">
      <div className="mb-3 flex items-start justify-between">
        <div>
          <h3 className="font-semibold text-gray-900">{station.name}</h3>
          {station.location && (
            <p className="text-sm text-gray-500">{station.location}</p>
          )}
        </div>

        <div className="flex gap-1">
          {confirmDelete ? (
            <>
              <button
                type="button"
                onClick={handleDelete}
                disabled={deleteStation.isPending}
                className="rounded bg-red-600 px-2 py-1 text-xs font-medium text-white hover:bg-red-700 disabled:opacity-50"
              >
                {deleteStation.isPending ? "Deleting..." : "Confirm"}
              </button>
              <button
                type="button"
                onClick={() => setConfirmDelete(false)}
                className="rounded bg-gray-100 px-2 py-1 text-xs font-medium text-gray-600 hover:bg-gray-200"
              >
                Cancel
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={handleDelete}
              className="rounded p-1 text-gray-400 hover:bg-red-50 hover:text-red-600"
              aria-label={`Delete station ${station.name}`}
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          )}
        </div>
      </div>

      <div className="border-t pt-3">
        {station.eyeId !== null ? (
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1 rounded-full bg-green-50 px-3 py-1 text-sm font-medium text-green-700">
              {station.eyeId}
              <button
                type="button"
                onClick={handleUnassign}
                disabled={unassignEye.isPending}
                className="ml-1 rounded-full p-0.5 hover:bg-green-200 disabled:opacity-50"
                aria-label={`Unassign eye ${station.eyeId}`}
              >
                <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </span>
          </div>
        ) : (
          <form onSubmit={handleAssign} className="flex items-center gap-2">
            <input
              type="text"
              value={eyeInput}
              onChange={(e) => setEyeInput(e.target.value)}
              placeholder="Enter eye ID (e.g. eye-1)"
              className="flex-1 rounded border px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              type="submit"
              disabled={assignEye.isPending || eyeInput.trim().length === 0}
              className="rounded bg-blue-600 px-3 py-1 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {assignEye.isPending ? "Assigning..." : "Assign"}
            </button>
          </form>
        )}
      </div>

      <div className="border-t pt-3">
        <p className="mb-1 text-xs font-medium text-gray-500">Max time at station (minutes)</p>
        <form onSubmit={handleThreshold} className="flex items-center gap-2">
          <input
            type="number"
            min="0.02"
            step="any"
            value={thresholdInput}
            onChange={(e) => setDirtyThreshold(e.target.value)}
            placeholder="No limit"
            className="w-24 rounded border px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            type="submit"
            disabled={updateStation.isPending}
            className="rounded bg-blue-600 px-3 py-1 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {updateStation.isPending ? "Saving..." : "Set"}
          </button>
          {station.maxDurationSeconds !== null && (
            <button
              type="button"
              onClick={() => {
                setDirtyThreshold(null);
                updateStation.mutate({ stationId: station.id, maxDurationSeconds: null });
              }}
              className="rounded px-2 py-1 text-sm text-gray-500 hover:bg-gray-100"
            >
              Clear
            </button>
          )}
        </form>
      </div>

      {mutationError && (
        <p className="mt-2 text-sm text-red-600">{mutationError.message}</p>
      )}
    </div>
  );
}
