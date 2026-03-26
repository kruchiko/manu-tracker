import { usePipelines } from "../hooks/usePipelines";
import { PipelineCard } from "./PipelineCard";

export function PipelineList() {
  const { data, isLoading, error } = usePipelines();

  if (isLoading) {
    return <p className="text-sm text-gray-500">Loading pipelines...</p>;
  }

  if (error) {
    return <p className="text-sm text-red-600">Failed to load pipelines: {error.message}</p>;
  }

  const pipelines = data ?? [];

  if (pipelines.length === 0) {
    return <p className="text-sm text-gray-500">No pipelines yet. Create one above.</p>;
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {pipelines.map((pipeline) => (
        <PipelineCard key={pipeline.id} pipeline={pipeline} />
      ))}
    </div>
  );
}
