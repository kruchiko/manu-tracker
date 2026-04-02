import { useCustomerOrders } from "../hooks/useCustomerOrders";
import { useDeleteCustomerOrder } from "../hooks/useDeleteCustomerOrder";
import type { CustomerOrderSummary } from "../customer-orders.types";

const STATUS_LABELS: Record<string, string> = {
  open: "Open",
  in_progress: "In Progress",
  fulfilled: "Fulfilled",
  cancelled: "Cancelled",
};

const STATUS_COLORS: Record<string, string> = {
  open: "bg-blue-100 text-blue-800",
  in_progress: "bg-yellow-100 text-yellow-800",
  fulfilled: "bg-green-100 text-green-800",
  cancelled: "bg-gray-100 text-gray-600",
};

interface CustomerOrderListProps {
  selectedId: number | null;
  onSelect: (order: CustomerOrderSummary) => void;
}

export function CustomerOrderList({ selectedId, onSelect }: CustomerOrderListProps) {
  const { data: orders, isLoading, error } = useCustomerOrders();
  const deleteMutation = useDeleteCustomerOrder();

  if (isLoading) return <p className="text-sm text-gray-500">Loading...</p>;
  if (error) return <p className="text-sm text-red-600">Error: {error.message}</p>;
  if (!orders?.length) return <p className="text-sm text-gray-500">No customer orders yet.</p>;

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-sm" role="grid">
        <thead>
          <tr className="border-b text-xs font-medium uppercase text-gray-500">
            <th className="px-3 py-2">Order #</th>
            <th className="px-3 py-2">Customer</th>
            <th className="px-3 py-2">Lines</th>
            <th className="px-3 py-2">Status</th>
            <th className="px-3 py-2">Allocated</th>
            <th className="px-3 py-2">Fulfilled</th>
            <th className="px-3 py-2">Due</th>
            <th className="px-3 py-2"></th>
          </tr>
        </thead>
        <tbody>
          {orders.map((order) => (
            <tr
              key={order.id}
              role="row"
              tabIndex={0}
              aria-selected={selectedId === order.id}
              onClick={() => onSelect(order)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  onSelect(order);
                }
              }}
              className={`cursor-pointer border-b transition-colors hover:bg-gray-50 ${
                selectedId === order.id ? "bg-blue-50" : ""
              }`}
            >
              <td className="px-3 py-2 font-mono text-xs">{order.orderNumber}</td>
              <td className="px-3 py-2">{order.customerName}</td>
              <td className="px-3 py-2 text-center">{order.lineCount}</td>
              <td className="px-3 py-2">
                <span
                  className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${
                    STATUS_COLORS[order.status] ?? ""
                  }`}
                >
                  {STATUS_LABELS[order.status] ?? order.status}
                </span>
              </td>
              <td className="px-3 py-2">
                <div className="flex items-center gap-2">
                  <div className="h-2 w-16 rounded-full bg-gray-200">
                    <div
                      className="h-2 rounded-full bg-blue-600 transition-all"
                      style={{ width: `${Math.min(order.allocationPct, 100)}%` }}
                    />
                  </div>
                  <span className="text-xs text-gray-600">{order.allocationPct}%</span>
                </div>
              </td>
              <td className="px-3 py-2">
                <div className="flex items-center gap-2">
                  <div className="h-2 w-16 rounded-full bg-gray-200">
                    <div
                      className="h-2 rounded-full bg-green-600 transition-all"
                      style={{ width: `${Math.min(order.fulfillmentPct, 100)}%` }}
                    />
                  </div>
                  <span className="text-xs text-gray-600">{order.fulfillmentPct}%</span>
                </div>
              </td>
              <td className="px-3 py-2 text-xs text-gray-500">
                {order.dueDate ?? "---"}
              </td>
              <td className="px-3 py-2">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (confirm(`Delete ${order.orderNumber}? Allocations will also be removed.`)) {
                      deleteMutation.mutate(order.id);
                    }
                  }}
                  className="rounded px-2 py-1 text-xs text-red-600 hover:bg-red-50"
                >
                  Delete
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
