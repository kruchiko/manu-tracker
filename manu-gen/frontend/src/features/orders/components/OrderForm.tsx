import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { createOrderSchema, type CreateOrderFormValues } from "../orders.schema";
import { useCreateOrder } from "../hooks/useCreateOrder";
import type { Order } from "../orders.types";

interface OrderFormProps {
  onOrderCreated: (order: Order) => void;
}

export function OrderForm({ onOrderCreated }: OrderFormProps) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CreateOrderFormValues>({
    resolver: zodResolver(createOrderSchema),
  });

  const { mutate, isPending, error } = useCreateOrder();

  function onSubmit(values: CreateOrderFormValues) {
    mutate(values, {
      onSuccess: (order) => {
        reset();
        onOrderCreated(order);
      },
    });
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
      <h2 className="text-lg font-semibold">New Order</h2>

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
        <label htmlFor="productType" className="text-sm font-medium">
          Product Type
        </label>
        <input
          id="productType"
          {...register("productType")}
          className="rounded border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Widget A"
        />
        {errors.productType && (
          <p className="text-xs text-red-600">{errors.productType.message}</p>
        )}
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="quantity" className="text-sm font-medium">
          Quantity
        </label>
        <input
          id="quantity"
          type="number"
          min={1}
          {...register("quantity", { valueAsNumber: true })}
          className="rounded border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="1"
        />
        {errors.quantity && (
          <p className="text-xs text-red-600">{errors.quantity.message}</p>
        )}
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="notes" className="text-sm font-medium">
          Notes <span className="text-gray-400">(optional)</span>
        </label>
        <textarea
          id="notes"
          {...register("notes")}
          rows={3}
          className="rounded border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Any special instructions…"
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
        {isPending ? "Creating…" : "Create Order"}
      </button>
    </form>
  );
}
