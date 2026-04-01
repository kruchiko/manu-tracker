import { useState } from "react";
import { CustomerOrderForm } from "./CustomerOrderForm";
import { CustomerOrderList } from "./CustomerOrderList";
import { CustomerOrderDetail } from "./CustomerOrderDetail";

export function CustomerOrdersPage() {
  const [selectedId, setSelectedId] = useState<number | null>(null);

  return (
    <div className="mx-auto max-w-6xl">
      <h2 className="mb-6 text-xl font-semibold text-gray-900">Customer Orders</h2>

      {selectedId !== null ? (
        <CustomerOrderDetail
          orderId={selectedId}
          onBack={() => setSelectedId(null)}
        />
      ) : (
        <>
          <div className="mb-8 grid grid-cols-1 gap-6 lg:grid-cols-5">
            <div className="rounded-lg border bg-white p-6 shadow-sm lg:col-span-3">
              <h3 className="mb-4 text-lg font-semibold">New Customer Order</h3>
              <CustomerOrderForm onCreated={(order) => setSelectedId(order.id)} />
            </div>
          </div>

          <div className="rounded-lg border bg-white p-6 shadow-sm">
            <h3 className="mb-4 text-lg font-semibold">All Orders</h3>
            <CustomerOrderList
              selectedId={selectedId}
              onSelect={(order) => setSelectedId(order.id)}
            />
          </div>
        </>
      )}
    </div>
  );
}
