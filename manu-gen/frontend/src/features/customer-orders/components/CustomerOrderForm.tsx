import { useMemo, useState } from "react";
import { useForm, useFieldArray, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { AlertCircle, Calendar, Check, Plus } from "lucide-react";
import { ScreenHeader } from "../../../shared/components/ScreenHeader";
import formStyles from "../../../shared/components/formScreenShared.module.css";
import prim from "../../../shared/components/createFormPrimitives.module.css";
import {
  createCustomerOrderSchema,
  type CreateCustomerOrderFormValues,
} from "../customer-orders.schema";
import { useCreateCustomerOrder } from "../hooks/useCreateCustomerOrder";
import { usePipelines } from "../../pipelines/hooks/usePipelines";
import type { Pipeline } from "../../pipelines/pipelines.types";
import type { CustomerOrder } from "../customer-orders.types";
import styles from "./CustomerOrderForm.module.css";

/** Stored pipeline id only counts if it exists and matches the line’s product type. */
function effectivePipelineIdForLine(
  pipelines: Pipeline[] | undefined,
  productTrimmed: string,
  storedId: string,
): string {
  if (!storedId) return "";
  const p = (pipelines ?? []).find((x) => String(x.id) === storedId);
  if (!p) return "";
  if (!productTrimmed) return storedId;
  return p.productType.trim() === productTrimmed ? storedId : "";
}

interface CustomerOrderFormProps {
  onCreated: (order: CustomerOrder) => void;
  onCancel: () => void;
  /** Navigates to Pipelines when the user activates “create one” in the line status. */
  onNavigateToPipelines?: () => void;
}

export function CustomerOrderForm({
  onCreated,
  onCancel,
  onNavigateToPipelines,
}: CustomerOrderFormProps) {
  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CreateCustomerOrderFormValues>({
    resolver: zodResolver(createCustomerOrderSchema),
    defaultValues: {
      customerName: "",
      notes: "",
      dueDate: "",
      lines: [{ productType: "", quantity: 1 }],
    },
  });

  const { fields, append, remove } = useFieldArray({ control, name: "lines" });
  const linesWatch = useWatch({ control, name: "lines" });
  const { mutate, isPending, error } = useCreateCustomerOrder();
  const { data: pipelines } = usePipelines();

  /** Visual-only pipeline pick per line (API payload unchanged until backend #32). */
  const [pipelineByLineId, setPipelineByLineId] = useState<Record<string, string>>({});

  const { totalQty, missingPipelineCount, pipelinesNeeded } = useMemo(() => {
    const lines = linesWatch ?? [];
    let qty = 0;
    let missing = 0;
    let need = 0;
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const q = typeof line?.quantity === "number" ? line.quantity : 0;
      qty += q;
      const productTrimmed = (line?.productType ?? "").trim();
      const productOk = productTrimmed.length > 0;
      const fieldId = fields[i]?.id;
      const storedId = fieldId ? (pipelineByLineId[fieldId] ?? "") : "";
      const pid = fieldId
        ? effectivePipelineIdForLine(pipelines, productTrimmed, storedId)
        : "";
      if (productOk && q >= 1) {
        need += 1;
        if (!pid) missing += 1;
      }
    }
    return { totalQty: qty, missingPipelineCount: missing, pipelinesNeeded: need };
  }, [linesWatch, fields, pipelineByLineId, pipelines]);

  function onSubmit(values: CreateCustomerOrderFormValues) {
    mutate(values, {
      onSuccess: (order) => {
        reset();
        setPipelineByLineId({});
        onCreated(order);
      },
    });
  }

  return (
    <form
      id="customer-order-create-form"
      onSubmit={handleSubmit(onSubmit)}
      className={prim.formRoot}
      noValidate
    >
      <ScreenHeader
        layout="inline"
        backLabel="Customer Orders"
        onBack={onCancel}
        title="New Customer Order"
        actions={
          <>
            <button type="button" className={formStyles.cancelButton} onClick={onCancel}>
              Cancel
            </button>
            <button
              type="submit"
              form="customer-order-create-form"
              className={formStyles.submitButton}
              disabled={isPending}
            >
              {isPending ? "Creating…" : "Create Order"}
            </button>
          </>
        }
      />

      <div className={formStyles.grid}>
        <div className={prim.formCardStatic}>
          <h2 className={prim.formSectionTitle}>Order details</h2>

          <div className={prim.fieldGroup}>
            <label htmlFor="customerName" className={prim.fieldLabel}>
              Customer name
            </label>
            <input
              id="customerName"
              {...register("customerName")}
              className={`${prim.input} ${errors.customerName ? prim.inputError : ""}`}
              placeholder="e.g. Müller Ceramics GmbH"
              autoComplete="organization"
            />
            {errors.customerName && (
              <p className={prim.fieldError}>{errors.customerName.message}</p>
            )}
          </div>

          <div className={prim.fieldGroup}>
            <label htmlFor="dueDate" className={prim.fieldLabel}>
              Due date{" "}
              <span className={prim.fieldOptional}>(optional)</span>
            </label>
            <div className={styles.dateRow}>
              <Calendar size={16} strokeWidth={1.75} className={styles.dateIcon} aria-hidden />
              <input
                id="dueDate"
                type="date"
                {...register("dueDate")}
                className={prim.input}
              />
            </div>
          </div>

          <div className={prim.fieldGroup}>
            <label htmlFor="notes" className={prim.fieldLabel}>
              Notes <span className={prim.fieldOptional}>(optional)</span>
            </label>
            <textarea
              id="notes"
              {...register("notes")}
              rows={3}
              className={prim.textarea}
              placeholder="Any special instructions…"
            />
          </div>

          <hr className={styles.summaryRule} />

          <div className={styles.summaryBlock}>
            <p className={styles.summaryLabel}>Summary</p>
            <div className={styles.summaryGrid}>
              <div className={styles.summaryRow}>
                <span className={styles.summaryKey}>Line items</span>
                <span className={styles.summaryVal}>{fields.length}</span>
              </div>
              <div className={styles.summaryRow}>
                <span className={styles.summaryKey}>Total quantity</span>
                <span className={styles.summaryVal}>{totalQty} pcs</span>
              </div>
              <div className={styles.summaryRow}>
                <span className={styles.summaryKey}>Pipelines needed</span>
                <span className={styles.summaryVal}>{pipelinesNeeded}</span>
              </div>
            </div>
            {missingPipelineCount > 0 && (
              <p className={styles.missingPipelines}>
                Missing pipelines: {missingPipelineCount}
              </p>
            )}
          </div>

          <div className={styles.infoBanner}>
            On save — one Job is created per line item and linked to its pipeline.
          </div>
        </div>

        <div className={prim.formCardStatic}>
          <div className={styles.linesHeader}>
            <h2 className={prim.formSectionTitle}>Line items</h2>
            <p className={styles.linesHint}>
              Each line generates one Job. Select product type, quantity, and pipeline.
            </p>
          </div>

          {fields.map((field, index) => {
            const line = linesWatch?.[index];
            const product = (line?.productType ?? "").trim();
            const qty = typeof line?.quantity === "number" ? line.quantity : 0;
            const storedPipelineId = pipelineByLineId[field.id] ?? "";
            const pid = effectivePipelineIdForLine(
              pipelines,
              product,
              storedPipelineId,
            );
            const productOk = product.length > 0 && qty >= 1;
            const pipelineOk = productOk && Boolean(pid);

            const lineOptions = (pipelines ?? []).filter(
              (p) => !product || p.productType === product,
            );

            return (
              <div key={field.id} className={styles.lineItemCard}>
                <div className={styles.lineItemTop}>
                  <span className={styles.lineIndex}>
                    <span className={styles.lineIndexLabelSpacer} aria-hidden="true">
                      {"\u00a0"}
                    </span>
                    <span className={styles.lineIndexValue}>{index + 1}</span>
                  </span>
                  <div className={styles.lineGrid}>
                    <div className={`${prim.fieldGroup} ${styles.lineGridField}`}>
                      <label className={prim.fieldLabel} htmlFor={`product-${field.id}`}>
                        Product type
                      </label>
                      <input
                        id={`product-${field.id}`}
                        {...register(`lines.${index}.productType`)}
                        className={`${prim.input} ${errors.lines?.[index]?.productType ? prim.inputError : ""}`}
                        placeholder="Type A – Hip Implant"
                      />
                      {errors.lines?.[index]?.productType && (
                        <p className={prim.fieldError}>
                          {errors.lines[index].productType?.message}
                        </p>
                      )}
                    </div>
                    <div className={`${prim.fieldGroup} ${styles.lineGridField}`}>
                      <label className={prim.fieldLabel} htmlFor={`qty-${field.id}`}>
                        Qty
                      </label>
                      <input
                        id={`qty-${field.id}`}
                        type="number"
                        min={1}
                        {...register(`lines.${index}.quantity`, { valueAsNumber: true })}
                        className={`${prim.input} ${styles.qtyInput} ${errors.lines?.[index]?.quantity ? prim.inputError : ""}`}
                      />
                      {errors.lines?.[index]?.quantity && (
                        <p className={prim.fieldError}>
                          {errors.lines[index].quantity?.message}
                        </p>
                      )}
                    </div>
                    <div className={`${prim.fieldGroup} ${styles.lineGridField}`}>
                      <label className={prim.fieldLabel} htmlFor={`pipe-${field.id}`}>
                        Pipeline
                      </label>
                      <select
                        id={`pipe-${field.id}`}
                        className={`${prim.select} ${productOk && !pid ? styles.pipelineError : ""}`}
                        value={pid}
                        onChange={(e) =>
                          setPipelineByLineId((prev) => ({
                            ...prev,
                            [field.id]: e.target.value,
                          }))
                        }
                      >
                        <option value="">Select pipeline…</option>
                        {lineOptions.map((p) => (
                          <option key={p.id} value={String(p.id)}>
                            {p.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className={styles.lineStatusCol}>
                      <span className={prim.fieldLabel} id={`status-label-${field.id}`}>
                        Status
                      </span>
                      <div
                        className={styles.lineStatusValue}
                        role="status"
                        aria-labelledby={`status-label-${field.id}`}
                      >
                        {!productOk && (
                          <span className={styles.statusMuted}>Enter product &amp; qty</span>
                        )}
                        {productOk && pipelineOk && (
                          <span className={`${styles.statusPill} ${styles.statusPillOk}`}>
                            <Check size={14} strokeWidth={2.5} aria-hidden />
                            Pipeline found
                          </span>
                        )}
                        {productOk && !pid && (
                          <span className={`${styles.statusPill} ${styles.statusPillBad}`}>
                            <AlertCircle size={14} strokeWidth={2} aria-hidden />
                            <span className={styles.statusPillBadText}>
                              No pipeline —{" "}
                              {onNavigateToPipelines ? (
                                <button
                                  type="button"
                                  className={styles.statusLinkHint}
                                  onClick={onNavigateToPipelines}
                                  aria-label="Open Pipelines to create a pipeline"
                                >
                                  create one
                                </button>
                              ) : (
                                <span className={styles.statusLinkFallback}>create one</span>
                              )}
                            </span>
                          </span>
                        )}
                      </div>
                    </div>
                    <div className={styles.removeCol}>
                      <span className={styles.removeColLabel} aria-hidden="true">
                        {"\u00a0"}
                      </span>
                      <div className={styles.removeColBody}>
                        <button
                          type="button"
                          className={`${styles.removeBtn} ${fields.length <= 1 ? styles.removeBtnHidden : ""}`}
                          tabIndex={fields.length <= 1 ? -1 : 0}
                          aria-hidden={fields.length <= 1}
                          onClick={() => {
                            if (fields.length <= 1) return;
                            remove(index);
                            setPipelineByLineId((prev) => {
                              const next = { ...prev };
                              delete next[field.id];
                              return next;
                            });
                          }}
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}

          {errors.lines?.root && (
            <p className={prim.fieldError}>{errors.lines.root.message}</p>
          )}

          <div className={styles.linesFooter}>
            <button
              type="button"
              className={styles.addLine}
              onClick={() => append({ productType: "", quantity: 1 })}
            >
              <Plus size={13} strokeWidth={2} aria-hidden />
              Add line item
            </button>
            <span className={styles.totals}>
              {fields.length} lines · {totalQty} pcs total
            </span>
          </div>
        </div>
      </div>

      {error && <div className={prim.serverError}>Error: {error.message}</div>}
    </form>
  );
}
