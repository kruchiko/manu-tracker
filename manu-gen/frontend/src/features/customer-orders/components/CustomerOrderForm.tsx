import { useMemo, useState } from "react";
import { useForm, useFieldArray, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { AlertCircle, Calendar, Check, ChevronLeft, Plus } from "lucide-react";
import {
  createCustomerOrderSchema,
  type CreateCustomerOrderFormValues,
} from "../customer-orders.schema";
import { useCreateCustomerOrder } from "../hooks/useCreateCustomerOrder";
import { usePipelines } from "../../pipelines/hooks/usePipelines";
import type { CustomerOrder } from "../customer-orders.types";
import styles from "./CustomerOrderForm.module.css";

interface CustomerOrderFormProps {
  onCreated: (order: CustomerOrder) => void;
  onCancel: () => void;
}

export function CustomerOrderForm({ onCreated, onCancel }: CustomerOrderFormProps) {
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
      const productOk = (line?.productType ?? "").trim().length > 0;
      const fieldId = fields[i]?.id;
      const pid = fieldId ? pipelineByLineId[fieldId] : "";
      if (productOk && q >= 1) {
        need += 1;
        if (!pid) missing += 1;
      }
    }
    return { totalQty: qty, missingPipelineCount: missing, pipelinesNeeded: need };
  }, [linesWatch, fields, pipelineByLineId]);

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
      className={styles.root}
      noValidate
    >
      <header className={styles.wizardHeader}>
        <div className={styles.wizardHeaderLeft}>
          <button type="button" className={styles.breadcrumb} onClick={onCancel}>
            <ChevronLeft size={16} strokeWidth={2} aria-hidden />
            Customer Orders
          </button>
          <h1 className={styles.pageTitle}>New Customer Order</h1>
        </div>
        <div className={styles.wizardActions}>
          <button type="button" className={styles.cancelBtn} onClick={onCancel}>
            Cancel
          </button>
          <button type="submit" className={styles.submitHeader} disabled={isPending}>
            {isPending ? "Creating…" : "Create Order"}
          </button>
        </div>
      </header>

      <div className={styles.twoCol}>
        <div className={styles.leftCard}>
          <h2 className={styles.cardSectionTitle}>Order details</h2>

          <div className={styles.fieldGroup}>
            <label htmlFor="customerName" className={styles.label}>
              Customer name
            </label>
            <input
              id="customerName"
              {...register("customerName")}
              className={`${styles.input} ${errors.customerName ? styles.inputError : ""}`}
              placeholder="e.g. Müller Ceramics GmbH"
              autoComplete="organization"
            />
            {errors.customerName && (
              <p className={styles.fieldError}>{errors.customerName.message}</p>
            )}
          </div>

          <div className={styles.fieldGroup}>
            <label htmlFor="dueDate" className={styles.label}>
              Due date <span className={styles.optional}>(optional)</span>
            </label>
            <div className={styles.dateRow}>
              <Calendar size={16} strokeWidth={1.75} className={styles.dateIcon} aria-hidden />
              <input
                id="dueDate"
                type="date"
                {...register("dueDate")}
                className={styles.input}
              />
            </div>
          </div>

          <div className={styles.fieldGroup}>
            <label htmlFor="notes" className={styles.label}>
              Notes <span className={styles.optional}>(optional)</span>
            </label>
            <textarea
              id="notes"
              {...register("notes")}
              rows={3}
              className={styles.textarea}
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

        <div className={styles.rightCard}>
          <div className={styles.linesHeader}>
            <h2 className={styles.linesTitle}>Line items</h2>
            <p className={styles.linesHint}>
              Each line generates one Job. Select product type, quantity, and pipeline.
            </p>
          </div>

          {fields.map((field, index) => {
            const line = linesWatch?.[index];
            const product = (line?.productType ?? "").trim();
            const qty = typeof line?.quantity === "number" ? line.quantity : 0;
            const pid = pipelineByLineId[field.id] ?? "";
            const productOk = product.length > 0 && qty >= 1;
            const pipelineOk = productOk && Boolean(pid);

            const lineOptions = (pipelines ?? []).filter(
              (p) => !product || p.productType === product,
            );

            return (
              <div key={field.id} className={styles.lineItemCard}>
                <div className={styles.lineItemTop}>
                  <span className={styles.lineIndex}>{index + 1}</span>
                  <div className={styles.lineGrid}>
                    <div className={styles.fieldGroup}>
                      <label className={styles.label} htmlFor={`product-${field.id}`}>
                        Product type
                      </label>
                      <input
                        id={`product-${field.id}`}
                        {...register(`lines.${index}.productType`)}
                        className={`${styles.input} ${errors.lines?.[index]?.productType ? styles.inputError : ""}`}
                        placeholder="Type A – Hip Implant"
                      />
                      {errors.lines?.[index]?.productType && (
                        <p className={styles.fieldError}>
                          {errors.lines[index].productType?.message}
                        </p>
                      )}
                    </div>
                    <div className={styles.fieldGroup}>
                      <label className={styles.label} htmlFor={`qty-${field.id}`}>
                        Qty
                      </label>
                      <input
                        id={`qty-${field.id}`}
                        type="number"
                        min={1}
                        {...register(`lines.${index}.quantity`, { valueAsNumber: true })}
                        className={`${styles.input} ${errors.lines?.[index]?.quantity ? styles.inputError : ""}`}
                      />
                      {errors.lines?.[index]?.quantity && (
                        <p className={styles.fieldError}>
                          {errors.lines[index].quantity?.message}
                        </p>
                      )}
                    </div>
                    <div className={styles.fieldGroup}>
                      <label className={styles.label} htmlFor={`pipe-${field.id}`}>
                        Pipeline
                      </label>
                      <select
                        id={`pipe-${field.id}`}
                        className={`${styles.select} ${productOk && !pid ? styles.pipelineError : ""}`}
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
                      <span className={styles.label}>Status</span>
                      {!productOk && (
                        <span className={styles.statusMuted}>Enter product &amp; qty</span>
                      )}
                      {productOk && pipelineOk && (
                        <span className={styles.statusOk}>
                          <Check size={14} strokeWidth={2.5} aria-hidden />
                          Pipeline selected
                        </span>
                      )}
                      {productOk && !pid && (
                        <span className={styles.statusBad}>
                          <AlertCircle size={14} strokeWidth={2} aria-hidden />
                          No pipeline selected
                        </span>
                      )}
                    </div>
                  </div>
                  {fields.length > 1 && (
                    <button
                      type="button"
                      className={styles.removeBtn}
                      onClick={() => {
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
                  )}
                </div>
              </div>
            );
          })}

          {errors.lines?.root && (
            <p className={styles.fieldError}>{errors.lines.root.message}</p>
          )}

          <div className={styles.linesFooter}>
            <button
              type="button"
              className={styles.addLine}
              onClick={() => append({ productType: "", quantity: 1 })}
            >
              <Plus size={14} strokeWidth={2} aria-hidden />
              Add line item
            </button>
            <span className={styles.totals}>
              {fields.length} lines · {totalQty} pcs total
            </span>
          </div>
        </div>
      </div>

      {error && <p className={styles.serverError}>Error: {error.message}</p>}
    </form>
  );
}
