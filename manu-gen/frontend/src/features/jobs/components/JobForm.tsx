import { useEffect } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { createJobSchema, type CreateJobFormValues } from "../jobs.schema";
import { useCreateJob } from "../hooks/useCreateJob";
import { usePipelines } from "../../pipelines/hooks/usePipelines";
import type { Job } from "../jobs.types";

interface JobFormProps {
  onJobCreated: (job: Job) => void;
}

export function JobForm({ onJobCreated }: JobFormProps) {
  const {
    register,
    handleSubmit,
    reset,
    control,
    setValue,
    formState: { errors },
  } = useForm<CreateJobFormValues>({
    resolver: zodResolver(createJobSchema),
    defaultValues: { pipelineId: "", productType: "" },
  });

  const { mutate, isPending, error } = useCreateJob();
  const { data: pipelines } = usePipelines();

  const selectedPipelineId = useWatch({ control, name: "pipelineId" });
  const selectedPipeline = pipelines?.find((p) => p.id === selectedPipelineId);

  useEffect(() => {
    if (selectedPipeline?.productType) {
      setValue("productType", selectedPipeline.productType);
    } else {
      setValue("productType", "");
    }
  }, [selectedPipelineId, selectedPipeline, setValue]);

  function onSubmit(values: CreateJobFormValues) {
    mutate(values, {
      onSuccess: (job) => {
        reset();
        onJobCreated(job);
      },
    });
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
      <h2 className="text-lg font-semibold">New Job</h2>

      <div className="flex flex-col gap-1">
        <label htmlFor="pipelineId" className="text-sm font-medium">
          Pipeline
        </label>
        <select
          id="pipelineId"
          {...register("pipelineId")}
          className={`rounded border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
            errors.pipelineId ? "border-red-400 ring-1 ring-red-400" : ""
          }`}
        >
          <option value="">Select a pipeline...</option>
          {pipelines?.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}{p.productType ? ` (${p.productType})` : ""}
            </option>
          ))}
        </select>
        {errors.pipelineId && (
          <p className="text-xs text-red-600">{errors.pipelineId.message}</p>
        )}
        {selectedPipeline && (
          <p className="text-xs text-gray-400">
            {selectedPipeline.productType && (
              <span>Product: {selectedPipeline.productType} &middot; </span>
            )}
            {selectedPipeline.steps.length} step{selectedPipeline.steps.length !== 1 ? "s" : ""}
            {selectedPipeline.totalExpectedSeconds !== null && (
              <span> &middot; ~{Math.round(selectedPipeline.totalExpectedSeconds / 60)}m expected</span>
            )}
            {selectedPipeline.effectiveCapacity !== null && (
              <span> &middot; max {selectedPipeline.effectiveCapacity} items/tray</span>
            )}
          </p>
        )}
      </div>

      <input type="hidden" {...register("productType")} />
      {errors.productType && (
        <p className="text-xs text-red-600">Select a pipeline to set the product type</p>
      )}

      <div className="flex flex-col gap-1">
        <label htmlFor="quantity" className="text-sm font-medium">
          Quantity
          {selectedPipeline?.effectiveCapacity !== null && selectedPipeline?.effectiveCapacity !== undefined && (
            <span className="ml-1 font-normal text-gray-400">(max {selectedPipeline.effectiveCapacity})</span>
          )}
        </label>
        <input
          id="quantity"
          type="number"
          min={1}
          max={selectedPipeline?.effectiveCapacity ?? undefined}
          {...register("quantity", { valueAsNumber: true })}
          className="rounded border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="1"
        />
        {errors.quantity && (
          <p className="text-xs text-red-600">{errors.quantity.message}</p>
        )}
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="notes" className="text-sm font-medium">
          Notes <span className="text-gray-400">(optional)</span>
        </label>
        <textarea
          id="notes"
          {...register("notes")}
          rows={3}
          className="rounded border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Any special instructions…"
        />
      </div>

      {error && (
        <p className="text-sm text-red-600">Error: {error.message}</p>
      )}

      <button
        type="submit"
        disabled={isPending || !selectedPipeline}
        className="rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
      >
        {isPending ? "Creating…" : "Create Job"}
      </button>
    </form>
  );
}
