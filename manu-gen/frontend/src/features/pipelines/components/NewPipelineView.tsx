import { useState } from "react";
import { FormPageLayout } from "../../../shared/components/FormPageLayout";
import { useCreatePipeline } from "../hooks/useCreatePipeline";
import { useStations } from "../../stations/hooks/useStations";
import { PipelineStepEditor } from "./PipelineStepEditor";
import type { StepFormValue } from "../pipelines.schema";
import prim from "../../../shared/components/createFormPrimitives.module.css";
import styles from "./NewPipelineView.module.css";

interface NewPipelineViewProps {
  onBack: () => void;
}

function FieldGroup({
  label,
  optional,
  error,
  children,
}: {
  label: string;
  optional?: string;
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
      {error && <p className={prim.fieldError}>{error}</p>}
    </div>
  );
}

export function NewPipelineView({ onBack }: NewPipelineViewProps): React.JSX.Element {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [productType, setProductType] = useState("");
  const [steps, setSteps] = useState<StepFormValue[]>([
    { stationId: "", maxDurationSeconds: null, maxCapacity: null },
  ]);
  const [submitted, setSubmitted] = useState(false);

  const createPipeline = useCreatePipeline();
  const { data: stations } = useStations();

  const nameError = submitted && name.trim().length === 0 ? "Pipeline name is required." : undefined;
  const productTypeError = submitted && productType.trim().length === 0 ? "Product type is required." : undefined;
  const validSteps = steps.filter((s) => s.stationId.length > 0);
  const stepsError = submitted && validSteps.length === 0;

  const totalSeconds = steps.reduce((sum, s) => sum + (s.maxDurationSeconds ?? 0), 0);
  const allHaveDuration = steps.length > 0 && steps.every((s) => s.maxDurationSeconds !== null);
  const minCapacity = steps
    .filter((s) => s.maxCapacity !== null)
    .reduce((min, s) => Math.min(min, s.maxCapacity!), Infinity);

  function handleSubmit(): void {
    setSubmitted(true);
    const trimmedName = name.trim();
    const trimmedProductType = productType.trim();
    if (trimmedName.length === 0 || trimmedProductType.length === 0 || validSteps.length === 0) return;

    createPipeline.mutate(
      { name: trimmedName, description: description.trim(), productType: trimmedProductType, steps: validSteps },
      { onSuccess: () => onBack() },
    );
  }

  return (
    <FormPageLayout
      backLabel="Pipelines"
      onBack={onBack}
      title="New Pipeline"
      onCancel={onBack}
      onSubmit={handleSubmit}
      submitLabel="Create Pipeline"
      isSubmitting={createPipeline.isPending}
      left={
        <div className={prim.formCard}>
          <h2 className={prim.formSectionTitle}>Pipeline details</h2>
          <div>
            <FieldGroup label="Name" error={nameError}>
              <input
                className={prim.input}
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Hip Implant Process"
              />
            </FieldGroup>

            <FieldGroup label="Product type" error={productTypeError}>
              <input
                className={prim.input}
                type="text"
                value={productType}
                onChange={(e) => setProductType(e.target.value)}
                placeholder="e.g. Type A"
              />
            </FieldGroup>

            <FieldGroup label="Description" optional="optional">
              <input
                className={prim.input}
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Optional notes"
              />
            </FieldGroup>
          </div>

          <div className={styles.summary}>
            <div className={styles.summaryTitle}>Summary</div>
            <div className={styles.summaryRow}>
              <span className={styles.summaryKey}>Steps</span>
              <span className={styles.summaryValue}>{validSteps.length}</span>
            </div>
            <div className={styles.summaryRow}>
              <span className={styles.summaryKey}>Total expected</span>
              <span className={styles.summaryValue}>
                {allHaveDuration ? `~${Math.round(totalSeconds / 60)} min` : "—"}
              </span>
            </div>
            <div className={styles.summaryRow}>
              <span className={styles.summaryKey}>Tightest tray capacity</span>
              <span className={styles.summaryValue}>
                {minCapacity < Infinity ? `${minCapacity} items` : "—"}
              </span>
            </div>
          </div>

          {createPipeline.error && (
            <div className={prim.serverError}>{createPipeline.error.message}</div>
          )}
        </div>
      }
      right={
        <div>
          <PipelineStepEditor
            steps={steps}
            stations={stations ?? []}
            onChange={setSteps}
          />
          {stepsError && (
            <p className={styles.stepsError}>
              At least one step with a station is required.
            </p>
          )}
        </div>
      }
    />
  );
}
