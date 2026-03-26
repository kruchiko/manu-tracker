import { useState } from "react";
import { useCreatePipeline } from "../hooks/useCreatePipeline";
import { useStations } from "../../stations/hooks/useStations";
import { PipelineStepEditor } from "./PipelineStepEditor";
import type { StepFormValue } from "../pipelines.schema";

export function CreatePipelineForm() {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [steps, setSteps] = useState<StepFormValue[]>([
    { stationId: "", maxDurationSeconds: null },
  ]);
  const [submitted, setSubmitted] = useState(false);

  const createPipeline = useCreatePipeline();
  const { data: stations } = useStations();

  const nameError = submitted && name.trim().length === 0;
  const validSteps = steps.filter((s) => s.stationId.length > 0);
  const stepsError = submitted && validSteps.length === 0;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitted(true);

    const trimmedName = name.trim();
    if (trimmedName.length === 0 || validSteps.length === 0) return;

    createPipeline.mutate(
      { name: trimmedName, description: description.trim(), steps: validSteps },
      {
        onSuccess: () => {
          setName("");
          setDescription("");
          setSteps([{ stationId: "", maxDurationSeconds: null }]);
          setSubmitted(false);
        },
      },
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4" noValidate>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="pipeline-name" className="mb-1 block text-sm font-medium text-gray-700">
            Name
          </label>
          <input
            id="pipeline-name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Standard Assembly"
            aria-invalid={nameError}
            className={`w-full rounded border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              nameError ? "border-red-400 ring-1 ring-red-400" : ""
            }`}
          />
          {nameError && (
            <p className="mt-1 text-xs text-red-600">Pipeline name is required.</p>
          )}
        </div>
        <div>
          <label htmlFor="pipeline-desc" className="mb-1 block text-sm font-medium text-gray-700">
            Description
          </label>
          <input
            id="pipeline-desc"
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Optional description"
            className="w-full rounded border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      <div className="max-w-sm sm:max-w-[calc(50%-0.5rem)]">
        <p className="mb-2 text-sm font-medium text-gray-700">Steps</p>
        <PipelineStepEditor
          steps={steps}
          stations={stations ?? []}
          onChange={setSteps}
        />
        {stepsError && (
          <p className="mt-1 text-xs text-red-600">At least one step with a station is required.</p>
        )}
      </div>

      {createPipeline.error && (
        <p className="text-sm text-red-600">{createPipeline.error.message}</p>
      )}

      <button
        type="submit"
        disabled={createPipeline.isPending}
        className="rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
      >
        {createPipeline.isPending ? "Creating..." : "Create Pipeline"}
      </button>
    </form>
  );
}
