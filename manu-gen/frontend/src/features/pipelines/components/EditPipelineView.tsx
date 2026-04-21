import { useState } from "react";
import { FormPageLayout } from "../../../shared/components/FormPageLayout";
import { useUpdatePipelineSteps } from "../hooks/useUpdatePipelineSteps";
import { useStations } from "../../stations/hooks/useStations";
import { PipelineStepEditor } from "./PipelineStepEditor";
import type { Pipeline } from "../pipelines.types";
import type { StepFormValue } from "../pipelines.schema";
import prim from "../../../shared/components/createFormPrimitives.module.css";
import styles from "./NewPipelineView.module.css";

interface EditPipelineViewProps {
  pipeline: Pipeline;
  onBack: () => void;
}

export function EditPipelineView({ pipeline, onBack }: EditPipelineViewProps): React.JSX.Element {
  const [steps, setSteps] = useState<StepFormValue[]>(() =>
    pipeline.steps.map((s) => ({
      stationId: s.stationId,
      minDurationSeconds: s.minDurationSeconds,
      maxDurationSeconds: s.maxDurationSeconds,
      minCapacity: s.minCapacity,
      maxCapacity: s.maxCapacity,
    })),
  );

  const updateSteps = useUpdatePipelineSteps();
  const { data: stations } = useStations();

  const validSteps = steps.filter((s) => s.stationId.length > 0);
  const totalSeconds = steps.reduce((sum, s) => sum + (s.maxDurationSeconds ?? 0), 0);
  const allHaveDuration = steps.length > 0 && steps.every((s) => s.maxDurationSeconds !== null);
  const minCapacity = steps
    .filter((s) => s.maxCapacity !== null)
    .reduce((min, s) => Math.min(min, s.maxCapacity!), Infinity);

  function handleSubmit(): void {
    if (validSteps.length === 0) return;
    updateSteps.mutate(
      { pipelineId: pipeline.id, steps: validSteps },
      { onSuccess: () => onBack() },
    );
  }

  return (
    <FormPageLayout
      backLabel="Pipelines"
      onBack={onBack}
      title="Edit Pipeline"
      onCancel={onBack}
      onSubmit={handleSubmit}
      submitLabel="Save changes"
      isSubmitting={updateSteps.isPending}
      left={
        <div className={prim.formCard}>
          <h2 className={prim.formSectionTitle}>Pipeline details</h2>
          <div>
            <div className={prim.fieldGroup}>
              <label className={prim.fieldLabel}>Name</label>
              <input className={prim.input} type="text" value={pipeline.name} readOnly />
            </div>
            <div className={prim.fieldGroup}>
              <label className={prim.fieldLabel}>Product type</label>
              <input className={prim.input} type="text" value={pipeline.productType} readOnly />
            </div>
            {pipeline.description && (
              <div className={prim.fieldGroup}>
                <label className={prim.fieldLabel}>
                  Description{" "}
                  <span className={prim.fieldOptional}>(optional)</span>
                </label>
                <input className={prim.input} type="text" value={pipeline.description} readOnly />
              </div>
            )}
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

          {updateSteps.error && (
            <div className={prim.serverError}>{updateSteps.error.message}</div>
          )}
        </div>
      }
      right={
        <PipelineStepEditor
          steps={steps}
          stations={stations ?? []}
          onChange={setSteps}
        />
      }
    />
  );
}
