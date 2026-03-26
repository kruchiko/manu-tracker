import { useState } from "react";
import type { Pipeline } from "../pipelines.types";
import { useDeletePipeline } from "../hooks/useDeletePipeline";
import { useUpdatePipelineSteps } from "../hooks/useUpdatePipelineSteps";
import { useStations } from "../../stations/hooks/useStations";
import { PipelineStepEditor } from "./PipelineStepEditor";
import type { StepFormValue } from "../pipelines.schema";

function formatMinutes(seconds: number | null): string {
  if (seconds === null) return "—";
  const m = Math.round(seconds / 60);
  return `${m}m`;
}

interface PipelineCardProps {
  pipeline: Pipeline;
}

export function PipelineCard({ pipeline }: PipelineCardProps) {
  const [editing, setEditing] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [steps, setSteps] = useState<StepFormValue[]>(() =>
    pipeline.steps.map((s) => ({
      stationId: s.stationId,
      maxDurationSeconds: s.maxDurationSeconds,
    })),
  );

  const deletePipeline = useDeletePipeline();
  const updateSteps = useUpdatePipelineSteps();
  const { data: stations } = useStations();

  function handleDelete() {
    if (!confirmDelete) {
      setConfirmDelete(true);
      return;
    }
    deletePipeline.mutate(pipeline.id, {
      onError: () => setConfirmDelete(false),
    });
  }

  function handleSaveSteps(e: React.FormEvent) {
    e.preventDefault();
    const validSteps = steps.filter((s) => s.stationId.length > 0);
    if (validSteps.length === 0) return;
    updateSteps.mutate(
      { pipelineId: pipeline.id, steps: validSteps },
      { onSuccess: () => setEditing(false) },
    );
  }

  function handleCancelEdit() {
    setSteps(
      pipeline.steps.map((s) => ({
        stationId: s.stationId,
        maxDurationSeconds: s.maxDurationSeconds,
      })),
    );
    setEditing(false);
  }

  const mutationError = deletePipeline.error ?? updateSteps.error;

  return (
    <div className="rounded-lg border bg-white p-5 shadow-sm">
      <div className="mb-3 flex items-start justify-between">
        <div>
          <h3 className="font-semibold text-gray-900">{pipeline.name}</h3>
          {pipeline.description && (
            <p className="text-sm text-gray-500">{pipeline.description}</p>
          )}
          <p className="mt-1 text-xs text-gray-400">
            {pipeline.steps.length} step{pipeline.steps.length !== 1 ? "s" : ""}
            {pipeline.totalExpectedSeconds !== null && (
              <span> &middot; ~{formatMinutes(pipeline.totalExpectedSeconds)} expected</span>
            )}
          </p>
        </div>

        <div className="flex gap-1">
          {confirmDelete ? (
            <>
              <button
                type="button"
                onClick={handleDelete}
                disabled={deletePipeline.isPending}
                className="rounded bg-red-600 px-2 py-1 text-xs font-medium text-white hover:bg-red-700 disabled:opacity-50"
              >
                {deletePipeline.isPending ? "Deleting..." : "Confirm"}
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
              aria-label={`Delete pipeline ${pipeline.name}`}
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          )}
        </div>
      </div>

      {!editing && (
        <div className="border-t pt-3">
          <div className="flex items-center gap-2">
            {pipeline.steps.map((step, i) => (
              <div key={step.id} className="flex items-center gap-2">
                {i > 0 && (
                  <svg className="h-3 w-3 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                  </svg>
                )}
                <span className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-700">
                  {step.stationName}
                  {step.maxDurationSeconds !== null && (
                    <span className="ml-1 text-gray-400">{formatMinutes(step.maxDurationSeconds)}</span>
                  )}
                </span>
              </div>
            ))}
          </div>
          <button
            type="button"
            onClick={() => setEditing(true)}
            className="mt-3 text-sm text-blue-600 hover:text-blue-800"
          >
            Edit steps
          </button>
        </div>
      )}

      {editing && (
        <form onSubmit={handleSaveSteps} className="border-t pt-3">
          <PipelineStepEditor
            steps={steps}
            stations={stations ?? []}
            onChange={setSteps}
          />
          <div className="mt-3 flex gap-2">
            <button
              type="submit"
              disabled={updateSteps.isPending}
              className="rounded bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {updateSteps.isPending ? "Saving..." : "Save Steps"}
            </button>
            <button
              type="button"
              onClick={handleCancelEdit}
              className="rounded bg-gray-100 px-3 py-1.5 text-sm font-medium text-gray-600 hover:bg-gray-200"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {mutationError && (
        <p className="mt-2 text-sm text-red-600">{mutationError.message}</p>
      )}
    </div>
  );
}
