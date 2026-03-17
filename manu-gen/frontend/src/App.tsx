import { useState } from "react";
import { OrderForm } from "./features/orders/components/OrderForm";
import { QrPreview } from "./features/orders/components/QrPreview";
import { OrderList } from "./features/orders/components/OrderList";
import type { Order } from "./features/orders/orders.types";

export function App() {
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <header className="mb-8 print:hidden">
        <h1 className="text-2xl font-bold text-gray-900">Manu Tracker</h1>
        <p className="text-sm text-gray-500">Manufacturing order management</p>
      </header>

      <div className="mx-auto max-w-6xl">
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
          <h2 className="mb-4 text-lg font-semibold">Recent Orders</h2>
          <OrderList
            selectedOrderId={selectedOrder?.id ?? null}
            onSelectOrder={setSelectedOrder}
          />
        </div>
      </div>
    </div>
  );
}
