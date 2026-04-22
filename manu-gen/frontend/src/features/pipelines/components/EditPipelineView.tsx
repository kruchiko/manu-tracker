import { useState } from "react";
import { FormPageLayout } from "../../../shared/components/FormPageLayout";
import { useSavePipeline } from "../hooks/useSavePipeline";
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
  const [name, setName] = useState(pipeline.name);
  const [productType, setProductType] = useState(pipeline.productType);
  const [description, setDescription] = useState(pipeline.description ?? "");
  const [steps, setSteps] = useState<StepFormValue[]>(() =>
    pipeline.steps.map((s) => ({
      stationId: s.stationId,
      minDurationSeconds: s.minDurationSeconds,
      maxDurationSeconds: s.maxDurationSeconds,
      minCapacity: s.minCapacity,
      maxCapacity: s.maxCapacity,
    })),
  );

  const savePipeline = useSavePipeline();
  const { data: stations } = useStations();

  const validSteps = steps.filter((s) => s.stationId.length > 0);
  const totalSeconds = steps.reduce((sum, s) => sum + (s.maxDurationSeconds ?? 0), 0);
  const allHaveDuration = steps.length > 0 && steps.every((s) => s.maxDurationSeconds !== null);
  const minCapacity = steps
    .filter((s) => s.maxCapacity !== null)
    .reduce((min, s) => Math.min(min, s.maxCapacity!), Infinity);

  async function handleSubmit(): Promise<void> {
    if (validSteps.length === 0) return;
    const trimmedName = name.trim();
    const trimmedProduct = productType.trim();
    if (!trimmedName || !trimmedProduct) return;
    try {
      await savePipeline.mutateAsync({
        pipelineId: pipeline.id,
        name: trimmedName,
        productType: trimmedProduct,
        description,
        steps: validSteps,
      });
      onBack();
    } catch {
      /* mutation surfaces error UI */
    }
  }

  const isSubmitting = savePipeline.isPending;

  return (
    <FormPageLayout
      backLabel="Pipelines"
      onBack={onBack}
      title="Edit Pipeline"
      onCancel={onBack}
      onSubmit={() => void handleSubmit()}
      submitLabel="Save changes"
      isSubmitting={isSubmitting}
      left={
        <div className={prim.formCard}>
          <h2 className={prim.formSectionTitle}>Pipeline details</h2>
          <div>
            <div className={prim.fieldGroup}>
              <label className={prim.fieldLabel} htmlFor="edit-pipeline-name">
                Name
              </label>
              <input
                id="edit-pipeline-name"
                className={prim.input}
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                autoComplete="off"
              />
            </div>
            <div className={prim.fieldGroup}>
              <label className={prim.fieldLabel} htmlFor="edit-pipeline-product">
                Product type
              </label>
              <input
                id="edit-pipeline-product"
                className={prim.input}
                type="text"
                value={productType}
                onChange={(e) => setProductType(e.target.value)}
                autoComplete="off"
              />
            </div>
            <div className={prim.fieldGroup}>
              <label className={prim.fieldLabel} htmlFor="edit-pipeline-desc">
                Description <span className={prim.fieldOptional}>(optional)</span>
              </label>
              <input
                id="edit-pipeline-desc"
                className={prim.input}
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                autoComplete="off"
              />
            </div>
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

          {savePipeline.error && (
            <div className={prim.serverError}>{savePipeline.error.message}</div>
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
