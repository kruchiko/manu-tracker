import { useEffect } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Clock } from "lucide-react";
import { FormPageLayout } from "../../../shared/components/FormPageLayout";
import { createJobSchema, type CreateJobFormValues } from "../jobs.schema";
import { useCreateJob } from "../hooks/useCreateJob";
import { usePipelines } from "../../pipelines/hooks/usePipelines";
import type { Job } from "../jobs.types";
import prim from "../../../shared/components/createFormPrimitives.module.css";
import styles from "./NewJobManualView.module.css";

interface NewJobManualViewProps {
  onBack: () => void;
  onCreated: (job: Job) => void;
}

function JobGenerationPreview({
  productLabel,
  hasPipeline,
}: {
  productLabel: string;
  hasPipeline: boolean;
}): React.JSX.Element {
  return (
    <div className={prim.previewShell}>
      <div className={prim.previewHeaderRow}>
        <span className={prim.previewTitle}>What will be generated</span>
        <span className={prim.previewHintInline}>
          A preview of the job and tray that the system will create on save.
        </span>
      </div>

      <div className={prim.previewBody}>
        <div className={styles.previewCard}>
          <div className={styles.previewCardBanner}>
            <div className={styles.previewCardBannerLabel}>Job that will be created</div>
          </div>
          <div className={styles.previewGrid}>
            <div>
              <div className={styles.previewFieldLabel}>Job number</div>
              <div className={styles.previewFieldValue}>
                <span className={styles.previewAccent}>—</span>{" "}
                <span className={styles.previewDim}>auto-assigned</span>
              </div>
            </div>
            <div>
              <div className={styles.previewFieldLabel}>Tray code</div>
              <div className={styles.previewFieldValue}>
                <span>—</span> <span className={styles.previewDim}>auto-assigned</span>
              </div>
            </div>
            <div>
              <div className={styles.previewFieldLabel}>Status</div>
              <div>
                <span className={styles.badgePending}>Pending</span>
              </div>
            </div>
            <div>
              <div className={styles.previewFieldLabel}>Customer order</div>
              <div className={styles.previewOrderLine}>None — manual job</div>
            </div>
          </div>
        </div>

        <div className={styles.qrPreview}>
          <div className={styles.qrPlaceholder} aria-hidden>
            <svg width={24} height={24} viewBox="0 0 24 24" fill="none" stroke="var(--text-disabled)" strokeWidth={1.5}>
              <rect x={3} y={3} width={7} height={7} />
              <rect x={14} y={3} width={7} height={7} />
              <rect x={3} y={14} width={7} height={7} />
              <rect x={14} y={14} width={3} height={3} />
              <rect x={19} y={14} width={2} height={2} />
              <rect x={14} y={19} width={2} height={2} />
              <rect x={19} y={19} width={2} height={2} />
            </svg>
          </div>
          <div>
            <div className={styles.qrTitle}>QR label generated on save</div>
            <div className={styles.qrHint}>
              Print from Jobs list after creation.
              <br />
              Attach to tray before first station scan.
            </div>
            {hasPipeline && productLabel && (
              <div className={styles.qrProductHint}>Product: {productLabel}</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export function NewJobManualView({ onBack, onCreated }: NewJobManualViewProps) {
  const {
    register,
    handleSubmit,
    reset,
    control,
    setValue,
    formState: { errors },
  } = useForm<CreateJobFormValues>({
    resolver: zodResolver(createJobSchema),
    defaultValues: { pipelineId: "", productType: "", quantity: 1 },
  });

  const { mutate, isPending, error } = useCreateJob();
  const { data: pipelines } = usePipelines();

  const selectedPipelineId = useWatch({ control, name: "pipelineId" });
  const selectedPipeline = pipelines?.find((p) => p.id === selectedPipelineId);
  const productTypeWatch = useWatch({ control, name: "productType" }) ?? "";

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
        onCreated(job);
      },
    });
  }

  return (
      <FormPageLayout
        backLabel="Jobs"
        onBack={onBack}
        title="Create Job manually"
        onCancel={onBack}
        onSubmit={handleSubmit(onSubmit)}
        submitLabel="Create Job"
        isSubmitting={isPending}
        left={
          <div className={prim.formCard}>
            <h2 className={prim.formSectionTitle}>Job details</h2>

            <div className={styles.warnBox}>
              <strong>Fallback scenario.</strong>
              <br />
              Jobs are created automatically from Customer Orders. Only use this form if a job
              cannot be linked to an order — for example, to process a sample run or correct a
              system error.
              <br />
              <br />
              Jobs created here will not appear in any Customer Order.
            </div>

            <div className={prim.fieldGroup}>
              <label htmlFor="pipelineId" className={prim.fieldLabel}>
                Pipeline
              </label>
              <select
                id="pipelineId"
                {...register("pipelineId")}
                className={`${prim.select} ${errors.pipelineId ? prim.inputError : ""}`}
              >
                <option value="">Select pipeline…</option>
                {pipelines?.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                    {p.productType ? ` — ${p.productType}` : ""}
                  </option>
                ))}
              </select>
              {errors.pipelineId && (
                <p className={prim.fieldError}>{errors.pipelineId.message}</p>
              )}
            </div>

            <div className={prim.fieldGroup}>
              <span className={prim.fieldLabel}>Product type</span>
              <div className={styles.readonlyRow}>
                <Clock size={11} strokeWidth={1.5} className={styles.readonlyIcon} aria-hidden />
                <span
                  className={
                    selectedPipeline?.productType ? styles.readonlyValue : styles.readonlyMuted
                  }
                >
                  {selectedPipeline?.productType ?? "Auto-filled from selected pipeline"}
                </span>
              </div>
              <p className={prim.fieldHint}>Set automatically once a pipeline is selected.</p>
            </div>

            <input type="hidden" {...register("productType")} />
            {errors.productType && (
              <p className={prim.fieldError}>Select a pipeline to set the product type</p>
            )}

            <div className={prim.fieldGroup}>
              <label htmlFor="quantity" className={prim.fieldLabel}>
                Quantity
                {selectedPipeline?.effectiveCapacity != null && (
                  <span className={prim.fieldOptional}>
                    {" "}
                    (max {selectedPipeline.effectiveCapacity})
                  </span>
                )}
              </label>
              <input
                id="quantity"
                type="number"
                min={1}
                max={selectedPipeline?.effectiveCapacity ?? undefined}
                {...register("quantity", { valueAsNumber: true })}
                className={`${prim.input} ${prim.inputNarrow}`}
                placeholder="20"
              />
              {errors.quantity && (
                <p className={prim.fieldError}>{errors.quantity.message}</p>
              )}
            </div>

            <div className={prim.fieldGroup}>
              <label htmlFor="notes" className={prim.fieldLabel}>
                Reason{" "}
                <span className={prim.fieldOptional}>(optional)</span>
              </label>
              <textarea
                id="notes"
                {...register("notes")}
                rows={3}
                className={prim.textarea}
                placeholder="Why is this job being created manually?"
              />
            </div>

            {error && <div className={prim.serverError}>Error: {error.message}</div>}
          </div>
        }
        right={
          <JobGenerationPreview
            productLabel={productTypeWatch}
            hasPipeline={Boolean(selectedPipelineId)}
          />
        }
      />
  );
}
