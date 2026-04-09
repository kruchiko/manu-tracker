import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { FormPageLayout } from "../../../shared/components/FormPageLayout";
import { useCreateStation } from "../hooks/useCreateStation";
import {
  createStationSchema,
  type CreateStationFormValues,
} from "../stations.schema";

interface NewStationViewProps {
  onBack: () => void;
}

function FieldGroup({
  label,
  optional,
  hint,
  error,
  children,
}: {
  label: string;
  optional?: string;
  hint?: string;
  error?: string;
  children: React.ReactNode;
}): React.JSX.Element {
  return (
    <div className="mb-[18px] last:mb-0">
      <label className="mb-[5px] block font-body text-[13px] font-medium text-text">
        {label}
        {optional && (
          <span className="ml-[3px] text-[11px] font-normal text-text-muted">
            {optional}
          </span>
        )}
      </label>
      {children}
      {hint && !error && (
        <p className="mt-[4px] text-[11px] text-text-muted">{hint}</p>
      )}
      {error && (
        <p className="mt-[4px] text-[11px] text-status-late">{error}</p>
      )}
    </div>
  );
}

function StationPreview({
  name,
  location,
  slotCapacity,
  cameraId,
}: {
  name: string;
  location: string;
  slotCapacity: number;
  cameraId: string;
}): React.JSX.Element {
  const displayName = name || "New Station";
  const displayLocation = location || "Location not set";
  const slots = Math.min(Math.max(slotCapacity, 1), 15);

  return (
    <div className="rounded-[var(--radius-lg)] border border-border bg-surface-2">
      <div className="px-[var(--space-6)] py-[var(--space-4)]">
        <span className="font-mono text-[10px] uppercase tracking-[var(--tracking-wider)] text-text-muted">
          Preview
        </span>
        <p className="mt-[var(--space-1)] text-[length:var(--text-xs)] text-text-muted">
          How this station will appear in the stations list and on the
          dashboard.
        </p>
      </div>

      <div className="flex flex-col gap-[var(--space-5)] p-[var(--space-6)]">
        {/* Station card preview */}
        <div>
          <div className="mb-[var(--space-2)] font-mono text-[10px] uppercase tracking-[var(--tracking-wider)] text-text-muted">
            Station card
          </div>
          <div className="overflow-hidden rounded-[var(--radius-lg)] border border-border bg-surface shadow-sm">
            <div className="flex items-start justify-between border-b border-border px-[var(--space-4)] py-[var(--space-3)]">
              <div>
                <div className="text-[15px] font-semibold text-text">
                  {displayName}
                </div>
                <div className="mt-[2px] text-[length:var(--text-sm)] text-text-muted">
                  {displayLocation}
                </div>
              </div>
              {cameraId ? (
                <span className="rounded-[var(--radius-sm)] bg-status-ok-bg px-[var(--space-2)] py-[2px] font-mono text-[10px] font-medium tracking-[var(--tracking-wide)] text-status-ok">
                  {cameraId}
                </span>
              ) : (
                <span className="rounded-[var(--radius-sm)] border border-dashed border-border-strong bg-surface-2 px-[var(--space-2)] py-[2px] font-mono text-[10px] text-text-muted">
                  No camera
                </span>
              )}
            </div>
            <div className="flex items-center justify-between px-[var(--space-4)] py-[var(--space-3)]">
              <span className="font-mono text-[10px] uppercase tracking-[var(--tracking-wide)] text-text-muted">
                Capacity
              </span>
              <div className="flex items-center gap-[var(--space-2)]">
                <div className="flex gap-[3px]">
                  {Array.from({ length: slots }).map((_, i) => (
                    <div
                      key={i}
                      className="size-[9px] rounded-[2px] border border-accent-muted bg-accent-light"
                    />
                  ))}
                </div>
                <span className="font-mono text-[length:var(--text-xs)] text-text-muted">
                  {slots} {slots === 1 ? "slot" : "slots"}
                  {slotCapacity === 0 && " (default)"}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

const inputClasses =
  "h-[36px] w-full rounded-[var(--radius-md)] border border-border bg-surface px-[12px] font-body text-[13px] text-text placeholder:text-text-disabled transition-[border-color,box-shadow] duration-[var(--duration-fast)] focus:border-accent focus:outline-none focus:shadow-[0_0_0_3px_rgba(26,95,170,.12)]";

export function NewStationView({ onBack }: NewStationViewProps): React.JSX.Element {
  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<CreateStationFormValues>({
    resolver: zodResolver(createStationSchema),
    defaultValues: { name: "", location: "", slotCapacity: 1, cameraId: "" },
  });

  const { mutate, isPending, error: serverError } = useCreateStation();

  const watchedName = useWatch({ control, name: "name" });
  const watchedLocation = useWatch({ control, name: "location" }) ?? "";
  const watchedSlotCapacity = useWatch({ control, name: "slotCapacity" }) ?? 1;
  const watchedCameraId = useWatch({ control, name: "cameraId" }) ?? "";

  function onSubmit(values: CreateStationFormValues): void {
    mutate(values, { onSuccess: () => onBack() });
  }

  return (
    <FormPageLayout
      backLabel="Stations"
      onBack={onBack}
      title="New Station"
      onCancel={onBack}
      onSubmit={handleSubmit(onSubmit)}
      submitLabel="Create Station"
      isSubmitting={isPending}
      left={
        <div className="sticky top-[24px] rounded-[var(--radius-lg)] border border-border bg-surface p-[20px] shadow-sm">
          <h2 className="mb-[16px] text-[13px] font-semibold text-text">
            Station details
          </h2>
          <div>
            <FieldGroup
              label="Name"
              hint="Use the name your team already uses on the floor."
              error={errors.name?.message}
            >
              <input
                {...register("name")}
                className={inputClasses}
                placeholder="e.g. Kiln A, Drying Room, Inspection Bench"
              />
            </FieldGroup>

            <FieldGroup
              label="Location"
              optional="optional"
            >
              <input
                {...register("location")}
                className={inputClasses}
                placeholder="e.g. Building B, Floor 2"
              />
            </FieldGroup>

            <FieldGroup
              label="Concurrent slot capacity"
              optional="optional"
              hint="How many trays this station can process simultaneously (1–15). Defaults to 1."
              error={errors.slotCapacity?.message}
            >
              <input
                type="number"
                {...register("slotCapacity", { valueAsNumber: true })}
                className={`${inputClasses} max-w-[120px]`}
                placeholder="1"
                min={1}
                max={15}
              />
            </FieldGroup>

            <FieldGroup
              label="Camera ID"
              optional="optional — can assign later"
              hint="The ID of the camera reading QR labels at this station."
            >
              <input
                {...register("cameraId")}
                className={inputClasses}
                placeholder="e.g. cam-01, eye-3"
              />
            </FieldGroup>
          </div>

          {serverError && (
            <div className="mt-[var(--space-5)] rounded-[var(--radius-md)] bg-status-late-bg p-[var(--space-3)] text-[length:var(--text-sm)] text-status-late">
              {serverError.message}
            </div>
          )}
        </div>
      }
      right={
        <StationPreview
          name={watchedName}
          location={watchedLocation}
          slotCapacity={watchedSlotCapacity}
          cameraId={watchedCameraId}
        />
      }
    />
  );
}
