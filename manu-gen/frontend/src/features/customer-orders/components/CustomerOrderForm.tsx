import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  createCustomerOrderSchema,
  type CreateCustomerOrderFormValues,
} from "../customer-orders.schema";
import { useCreateCustomerOrder } from "../hooks/useCreateCustomerOrder";
import type { CustomerOrder } from "../customer-orders.types";
import styles from "./CustomerOrderForm.module.css";

interface CustomerOrderFormProps {
  onCreated: (order: CustomerOrder) => void;
}

export function CustomerOrderForm({ onCreated }: CustomerOrderFormProps) {
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
  const { mutate, isPending, error } = useCreateCustomerOrder();

  function onSubmit(values: CreateCustomerOrderFormValues) {
    mutate(values, {
      onSuccess: (order) => {
        reset();
        onCreated(order);
      },
    });
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className={styles.form} noValidate>
      <div className={styles.fieldGroup}>
        <label htmlFor="customerName" className={styles.label}>
          Customer Name
        </label>
        <input
          id="customerName"
          {...register("customerName")}
          className={`${styles.input} ${errors.customerName ? styles.inputError : ""}`}
          placeholder="Acme Corp"
          autoComplete="organization"
        />
        {errors.customerName && (
          <p className={styles.fieldError}>{errors.customerName.message}</p>
        )}
      </div>

      <div className={styles.fieldGroup}>
        <label htmlFor="dueDate" className={styles.label}>
          Due Date <span className={styles.optional}>(optional)</span>
        </label>
        <input
          id="dueDate"
          type="date"
          {...register("dueDate")}
          className={styles.input}
        />
      </div>

      <fieldset className={styles.fieldset}>
        <legend className={styles.legend}>Line Items</legend>
        {fields.map((field, index) => (
          <div key={field.id} className={styles.lineRow}>
            <div className={styles.lineFields}>
              <div className={styles.lineField}>
                <input
                  {...register(`lines.${index}.productType`)}
                  className={`${styles.input} ${errors.lines?.[index]?.productType ? styles.inputError : ""}`}
                  placeholder="Product type"
                  aria-label={`Line ${index + 1} product type`}
                />
                {errors.lines?.[index]?.productType && (
                  <p className={styles.fieldError}>
                    {errors.lines[index].productType?.message}
                  </p>
                )}
              </div>
              <div className={styles.qtyField}>
                <input
                  type="number"
                  min={1}
                  {...register(`lines.${index}.quantity`, { valueAsNumber: true })}
                  className={`${styles.input} ${errors.lines?.[index]?.quantity ? styles.inputError : ""}`}
                  placeholder="Qty"
                  aria-label={`Line ${index + 1} quantity`}
                />
                {errors.lines?.[index]?.quantity && (
                  <p className={styles.fieldError}>
                    {errors.lines[index].quantity?.message}
                  </p>
                )}
              </div>
            </div>
            {fields.length > 1 && (
              <button
                type="button"
                onClick={() => remove(index)}
                className={styles.removeBtn}
              >
                Remove
              </button>
            )}
          </div>
        ))}
        {errors.lines?.root && (
          <p className={styles.fieldError}>{errors.lines.root.message}</p>
        )}
        <button
          type="button"
          onClick={() => append({ productType: "", quantity: 1 })}
          className={styles.addLine}
        >
          + Add line
        </button>
      </fieldset>

      <div className={styles.fieldGroup}>
        <label htmlFor="notes" className={styles.label}>
          Notes <span className={styles.optional}>(optional)</span>
        </label>
        <textarea
          id="notes"
          {...register("notes")}
          rows={2}
          className={styles.textarea}
          placeholder="Any special instructions..."
        />
      </div>

      {error && <p className={styles.serverError}>Error: {error.message}</p>}

      <button type="submit" disabled={isPending} className={styles.submit}>
        {isPending ? "Creating..." : "Create Order"}
      </button>
    </form>
  );
}
