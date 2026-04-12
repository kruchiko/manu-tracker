import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { FormPageLayout } from "../../../shared/components/FormPageLayout";
import { useCreateStation } from "../hooks/useCreateStation";
import {
  createStationSchema,
  type CreateStationFormValues,
} from "../stations.schema";
import styles from "./NewStationView.module.css";

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
    <div className={styles.fieldGroup}>
      <label className={styles.fieldLabel}>
        {label}
        {optional && <span className={styles.fieldOptional}>{optional}</span>}
      </label>
      {children}
      {hint && !error && <p className={styles.fieldHint}>{hint}</p>}
      {error && <p className={styles.fieldError}>{error}</p>}
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
    <div className={styles.previewCard}>
      <div className={styles.previewHeader}>
        <span className={styles.previewLabel}>Preview</span>
        <p className={styles.previewHint}>
          How this station will appear in the stations list and on the dashboard.
        </p>
      </div>

      <div className={styles.previewBody}>
        <div>
          <div className={styles.previewSectionLabel}>Station card</div>
          <div className={styles.previewMockCard}>
            <div className={styles.previewMockHeader}>
              <div>
                <div className={styles.previewMockName}>{displayName}</div>
                <div className={styles.previewMockLocation}>{displayLocation}</div>
              </div>
              {cameraId ? (
                <span className={styles.previewCameraBadge}>{cameraId}</span>
              ) : (
                <span className={styles.previewCameraNone}>No camera</span>
              )}
            </div>
            <div className={styles.previewCapacityRow}>
              <span className={styles.previewCapacityLabel}>Capacity</span>
              <div className={styles.previewCapacityValue}>
                <div className={styles.previewSlotDots}>
                  {Array.from({ length: slots }).map((_, i) => (
                    <div key={i} className={styles.previewSlotDot} />
                  ))}
                </div>
                <span className={styles.previewSlotLabel}>
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
        <div className={styles.formCard}>
          <h2 className={styles.formTitle}>Station details</h2>
          <div>
            <FieldGroup
              label="Name"
              hint="Use the name your team already uses on the floor."
              error={errors.name?.message}
            >
              <input
                {...register("name")}
                className={styles.input}
                placeholder="e.g. Kiln A, Drying Room, Inspection Bench"
              />
            </FieldGroup>

            <FieldGroup label="Location" optional="optional">
              <input
                {...register("location")}
                className={styles.input}
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
                className={`${styles.input} ${styles.inputNarrow}`}
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
                className={styles.input}
                placeholder="e.g. cam-01, eye-3"
              />
            </FieldGroup>
          </div>

          {serverError && (
            <div className={styles.serverError}>{serverError.message}</div>
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
