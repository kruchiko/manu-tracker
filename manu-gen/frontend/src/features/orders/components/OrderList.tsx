import { useOrders } from "../hooks/useOrders";
import type { Order } from "../orders.types";

interface OrderListProps {
  selectedOrderId: number | null;
  onSelectOrder: (order: Order) => void;
}

export function OrderList({ selectedOrderId, onSelectOrder }: OrderListProps) {
  const { data, isLoading, error } = useOrders();

  if (isLoading) {
    return <p className="text-sm text-gray-500">Loading orders…</p>;
  }

  if (error) {
    return <p className="text-sm text-red-600">Failed to load orders: {error.message}</p>;
  }

  const orders = data ?? [];

  if (orders.length === 0) {
    return (
      <p className="text-sm text-gray-500">No orders yet. Create one above.</p>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm" role="grid">
        <thead>
          <tr className="border-b text-left text-gray-500">
            <th className="py-2 pr-4 font-medium">Order #</th>
            <th className="py-2 pr-4 font-medium">Customer</th>
            <th className="py-2 pr-4 font-medium">Product</th>
            <th className="py-2 pr-4 font-medium">Pipeline</th>
            <th className="py-2 pr-4 font-medium">Qty</th>
            <th className="py-2 pr-4 font-medium">Tray Code</th>
            <th className="py-2 font-medium">Created At</th>
          </tr>
        </thead>
        <tbody>
          {orders.map((order) => (
            <tr
              key={order.id}
              onClick={() => onSelectOrder(order)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  onSelectOrder(order);
                }
              }}
              tabIndex={0}
              aria-selected={selectedOrderId === order.id}
              className={`cursor-pointer border-b hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500 ${
                selectedOrderId === order.id ? "bg-blue-50" : ""
              }`}
            >
              <td className="py-2 pr-4 font-mono">{order.orderNumber}</td>
              <td className="py-2 pr-4">{order.customerName}</td>
              <td className="py-2 pr-4">{order.productType}</td>
              <td className="py-2 pr-4">{order.pipelineName}</td>
              <td className="py-2 pr-4">{order.quantity}</td>
              <td className="py-2 pr-4 font-mono">{order.trayCode}</td>
              <td className="py-2">
                {new Date(order.createdAt).toLocaleString()}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
