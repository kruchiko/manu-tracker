import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  createCustomerOrderSchema,
  type CreateCustomerOrderFormValues,
} from "../customer-orders.schema";
import { useCreateCustomerOrder } from "../hooks/useCreateCustomerOrder";
import type { CustomerOrder } from "../customer-orders.types";

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
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <label htmlFor="customerName" className="text-sm font-medium">
          Customer Name
        </label>
        <input
          id="customerName"
          {...register("customerName")}
          className="rounded border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Acme Corp"
        />
        {errors.customerName && (
          <p className="text-xs text-red-600">{errors.customerName.message}</p>
        )}
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="dueDate" className="text-sm font-medium">
          Due Date <span className="text-gray-400">(optional)</span>
        </label>
        <input
          id="dueDate"
          type="date"
          {...register("dueDate")}
          className="rounded border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <fieldset className="flex flex-col gap-3">
        <legend className="text-sm font-medium">Line Items</legend>
        {fields.map((field, index) => (
          <div key={field.id} className="flex items-start gap-2">
            <div className="flex flex-1 flex-col gap-1">
              <input
                {...register(`lines.${index}.productType`)}
                className="rounded border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Product type"
              />
              {errors.lines?.[index]?.productType && (
                <p className="text-xs text-red-600">
                  {errors.lines[index].productType?.message}
                </p>
              )}
            </div>
            <div className="flex w-24 flex-col gap-1">
              <input
                type="number"
                min={1}
                {...register(`lines.${index}.quantity`, { valueAsNumber: true })}
                className="rounded border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Qty"
              />
              {errors.lines?.[index]?.quantity && (
                <p className="text-xs text-red-600">
                  {errors.lines[index].quantity?.message}
                </p>
              )}
            </div>
            {fields.length > 1 && (
              <button
                type="button"
                onClick={() => remove(index)}
                className="mt-1 rounded px-2 py-1.5 text-sm text-red-600 hover:bg-red-50"
              >
                Remove
              </button>
            )}
          </div>
        ))}
        {errors.lines?.root && (
          <p className="text-xs text-red-600">{errors.lines.root.message}</p>
        )}
        <button
          type="button"
          onClick={() => append({ productType: "", quantity: 1 })}
          className="self-start rounded border border-dashed border-gray-300 px-3 py-1.5 text-sm text-gray-600 hover:border-gray-400 hover:text-gray-800"
        >
          + Add line
        </button>
      </fieldset>

      <div className="flex flex-col gap-1">
        <label htmlFor="notes" className="text-sm font-medium">
          Notes <span className="text-gray-400">(optional)</span>
        </label>
        <textarea
          id="notes"
          {...register("notes")}
          rows={2}
          className="rounded border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Any special instructions..."
        />
      </div>

      {error && (
        <p className="text-sm text-red-600">Error: {error.message}</p>
      )}

      <button
        type="submit"
        disabled={isPending}
        className="rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
      >
        {isPending ? "Creating..." : "Create Order"}
      </button>
    </form>
  );
}
