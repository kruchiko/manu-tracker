import { useState } from "react";
import { OrderForm } from "./OrderForm";
import { QrPreview } from "./QrPreview";
import { OrderList } from "./OrderList";
import type { Order } from "../orders.types";

export function OrdersPage() {
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  return (
    <div className="mx-auto max-w-6xl">
      <h2 className="mb-6 text-xl font-semibold text-gray-900 print:hidden">Orders</h2>

      <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-2">
        <div className="rounded-lg border bg-white p-6 shadow-sm print:hidden">
          <OrderForm onOrderCreated={setSelectedOrder} />
        </div>

        <div
          className={`rounded-lg border bg-white p-6 shadow-sm${selectedOrder === null ? " print:hidden" : ""}`}
        >
          {selectedOrder !== null ? (
            <QrPreview order={selectedOrder} />
          ) : (
            <div className="flex h-full items-center justify-center text-sm text-gray-400">
              Create an order to see the QR code
            </div>
          )}
        </div>
      </div>

      <div className="rounded-lg border bg-white p-6 shadow-sm print:hidden">
        <h3 className="mb-4 text-lg font-semibold">Recent Orders</h3>
        <OrderList
          selectedOrderId={selectedOrder?.id ?? null}
          onSelectOrder={setSelectedOrder}
        />
      </div>
    </div>
  );
}
