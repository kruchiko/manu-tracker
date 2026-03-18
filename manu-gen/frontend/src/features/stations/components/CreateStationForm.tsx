import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { createStationSchema, type CreateStationFormValues } from "../stations.schema";
import { useCreateStation } from "../hooks/useCreateStation";

export function CreateStationForm() {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CreateStationFormValues>({
    resolver: zodResolver(createStationSchema),
  });

  const { mutate, isPending, error } = useCreateStation();

  function onSubmit(values: CreateStationFormValues) {
    mutate(values, { onSuccess: () => reset() });
  }

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="flex flex-wrap items-end gap-3"
    >
      <div className="flex flex-col gap-1">
        <label htmlFor="station-name" className="text-sm font-medium">
          Name
        </label>
        <input
          id="station-name"
          {...register("name")}
          className="rounded border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="e.g. Polishing"
        />
        <p className="min-h-4 text-xs text-red-600">
          {errors.name?.message ?? "\u00A0"}
        </p>
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="station-location" className="text-sm font-medium">
          Location <span className="text-gray-400">(optional)</span>
        </label>
        <input
          id="station-location"
          {...register("location")}
          className="rounded border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="e.g. Floor 2"
        />
        <p className="min-h-4 text-xs">{"\u00A0"}</p>
      </div>

      <div className="flex flex-col gap-1">
        <button
          type="submit"
          disabled={isPending}
          className="rounded border border-blue-600 bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:border-blue-700 hover:bg-blue-700 disabled:opacity-50"
        >
          {isPending ? "Creating..." : "Create Station"}
        </button>
        <p className="min-h-4 text-xs">{"\u00A0"}</p>
      </div>

      {error && (
        <p className="w-full text-sm text-red-600">Error: {error.message}</p>
      )}
    </form>
  );
}
