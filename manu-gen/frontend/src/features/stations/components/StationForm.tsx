import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { FormPageLayout } from "../../../shared/components/FormPageLayout";
import {
  createStationSchema,
  type CreateStationFormValues,
} from "../stations.schema";
import prim from "../../../shared/components/createFormPrimitives.module.css";
import styles from "./StationForm.module.css";

export interface StationPipelineRef {
  pipelineId: string;
  name: string;
  stepPosition: number;
  stepTotal: number;
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
    <div className={prim.fieldGroup}>
      <label className={prim.fieldLabel}>
        {label}
        {optional !== undefined && optional !== "" && (
          <>
            {" "}
            <span className={prim.fieldOptional}>({optional})</span>
          </>
        )}
      </label>
      {children}
      {hint && !error && <p className={prim.fieldHint}>{hint}</p>}
      {error && <p className={prim.fieldError}>{error}</p>}
    </div>
  );
}

function clampSlots(n: number): number {
  return Math.min(Math.max(n, 1), 15);
}

function StationPreview({
  name,
  location,
  slotCapacity,
  cameraId,
  pipelineRefs,
  showPipelinesBlock,
}: {
  name: string;
  location: string;
  slotCapacity: number;
  cameraId: string;
  pipelineRefs: StationPipelineRef[] | undefined;
  showPipelinesBlock: boolean;
}): React.JSX.Element {
  const displayName = name || "New Station";
  const displayLocation = location || "Location not set";
  const slots = clampSlots(Number.isFinite(slotCapacity) ? slotCapacity : 1);

  return (
    <div className={prim.previewShell}>
      <div className={prim.previewHeaderRow}>
        <span className={prim.previewTitle}>Preview</span>
        <span className={prim.previewHintInline}>
          How this station appears in the stations list and on the dashboard.
        </span>
      </div>

      <div className={prim.previewBody}>
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

        {showPipelinesBlock && (
          <div>
            <div className={styles.previewSectionLabel}>Used in pipelines</div>
            {pipelineRefs && pipelineRefs.length > 0 ? (
              <>
                <div className={styles.previewPipelineList}>
                  {pipelineRefs.map((p) => (
                    <div key={`${p.pipelineId}-${p.stepPosition}`} className={styles.previewPipelineRow}>
                      <span className={styles.previewPipelineName}>{p.name}</span>
                      <span className={styles.previewPipelineMeta}>
                        {" "}
                        · Step {p.stepPosition} of {p.stepTotal}
                      </span>
                    </div>
                  ))}
                </div>
                <p className={styles.previewPipelineFootnote}>
                  Renaming this station will automatically update all pipeline references.
                </p>
              </>
            ) : (
              <p className={styles.previewEmptyPipelines}>Not used in any pipeline yet.</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export interface StationFormProps {
  title: string;
  submitLabel: string;
  defaultValues: CreateStationFormValues;
  isSubmitting: boolean;
  errorMessage: string | null;
  onBack: () => void;
  onSubmit: (values: CreateStationFormValues) => void;
  /** Back control label — design: station name on edit, &quot;Stations&quot; on create */
  backLabel?: string;
  /** When set, shows the &quot;Used in pipelines&quot; block (edit). */
  pipelineRefs?: StationPipelineRef[];
  /** Left column content below fields (e.g. danger zone on edit) */
  dangerZone?: React.ReactNode;
}

export function StationForm({
  title,
  submitLabel,
  defaultValues,
  isSubmitting,
  errorMessage,
  onBack,
  onSubmit,
  backLabel = "Stations",
  pipelineRefs,
  dangerZone,
}: StationFormProps): React.JSX.Element {
  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<CreateStationFormValues>({
    resolver: zodResolver(createStationSchema),
    defaultValues,
  });

  const watchedName = useWatch({ control, name: "name" });
  const watchedLocation = useWatch({ control, name: "location" }) ?? "";
  const watchedSlotCapacity = useWatch({ control, name: "slotCapacity" }) ?? 1;
  const watchedCameraId = useWatch({ control, name: "cameraId" }) ?? "";

  const showPipelinesBlock = pipelineRefs !== undefined;

  return (
    <FormPageLayout
      backLabel={backLabel}
      onBack={onBack}
      title={title}
      onCancel={onBack}
      onSubmit={handleSubmit(onSubmit)}
      submitLabel={submitLabel}
      isSubmitting={isSubmitting}
      left={
        <div className={prim.formCard}>
          <h2 className={prim.formSectionTitle}>Station details</h2>
          <div>
            <FieldGroup
              label="Name"
              hint="Use the name your team already uses on the floor."
              error={errors.name?.message}
            >
              <input
                {...register("name")}
                className={prim.input}
                placeholder="e.g. Kiln A, Drying Room, Inspection Bench"
              />
            </FieldGroup>

            <FieldGroup label="Location" optional="optional">
              <input
                {...register("location")}
                className={prim.input}
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
                className={`${prim.input} ${prim.inputNarrow}`}
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
                className={prim.input}
                placeholder="e.g. cam-01, eye-3"
              />
            </FieldGroup>
          </div>

          {dangerZone}

          {errorMessage && <div className={prim.serverError}>{errorMessage}</div>}
        </div>
      }
      right={
        <StationPreview
          name={watchedName}
          location={watchedLocation}
          slotCapacity={watchedSlotCapacity}
          cameraId={watchedCameraId}
          pipelineRefs={pipelineRefs}
          showPipelinesBlock={showPipelinesBlock}
        />
      }
    />
  );
}
