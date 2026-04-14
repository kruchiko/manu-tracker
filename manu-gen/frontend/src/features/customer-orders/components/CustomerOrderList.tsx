import { useMemo, useState } from "react";
import { useCustomerOrders } from "../hooks/useCustomerOrders";
import { useDeleteCustomerOrder } from "../hooks/useDeleteCustomerOrder";
import type { CustomerOrderSummary } from "../customer-orders.types";
import {
  ORDER_FILTER_TABS,
  orderMatchesFilter,
  type OrderListFilter,
} from "./customerOrderStatusLabels";
import { CustomerOrderStatusBadge } from "./CustomerOrderStatusBadge";
import styles from "./CustomerOrderList.module.css";

interface CustomerOrderListProps {
  selectedId: number | null;
  onSelect: (order: CustomerOrderSummary) => void;
}

export function CustomerOrderList({ selectedId, onSelect }: CustomerOrderListProps) {
  const { data: orders, isLoading, error } = useCustomerOrders();
  const deleteMutation = useDeleteCustomerOrder();
  const [filter, setFilter] = useState<OrderListFilter>("all");

  const filteredOrders = useMemo(() => {
    if (!orders?.length) return [];
    return orders.filter((o) => orderMatchesFilter(o.status, filter));
  }, [orders, filter]);

  const filteredCount = filteredOrders.length;

  if (isLoading) return <p className={styles.loading}>Loading...</p>;
  if (error) return <p className={styles.error}>Error: {error.message}</p>;
  if (!orders?.length) return <p className={styles.empty}>No customer orders yet.</p>;

  return (
    <div className={styles.listCard}>
      <div className={styles.listCardHead}>
        <span className={styles.listCardTitle}>All Orders</span>
        <div className={styles.listCardToolbar}>
          <div className={styles.segments} role="group" aria-label="Filter orders by status">
            {ORDER_FILTER_TABS.map((tab) => (
              <button
                key={tab.id}
                type="button"
                aria-pressed={filter === tab.id}
                className={`${styles.segment} ${filter === tab.id ? styles.segmentActive : ""}`}
                onClick={() => setFilter(tab.id)}
              >
                {tab.label}
              </button>
            ))}
          </div>
          <span className={styles.count}>
            {filteredCount} {filteredCount === 1 ? "order" : "orders"}
          </span>
        </div>
      </div>

      <div className={styles.scroll}>
        <table className={styles.table} role="grid">
          <thead>
            <tr>
              <th className={styles.th}>Order #</th>
              <th className={styles.th}>Customer</th>
              <th className={styles.th}>Lines</th>
              <th className={styles.th}>Status</th>
              <th className={styles.th}>Allocated</th>
              <th className={styles.th}>Fulfilled</th>
              <th className={styles.th}>Due</th>
              <th className={`${styles.th} ${styles.thActions}`} />
            </tr>
          </thead>
          <tbody>
            {filteredOrders.map((order) => (
              <tr
                key={order.id}
                role="row"
                tabIndex={0}
                aria-selected={selectedId === order.id}
                className={`${styles.row} ${selectedId === order.id ? styles.rowSelected : ""}`}
                onClick={() => onSelect(order)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    onSelect(order);
                  }
                }}
              >
                <td className={`${styles.td} ${styles.mono}`}>{order.orderNumber}</td>
                <td className={`${styles.td} ${styles.body}`}>{order.customerName}</td>
                <td className={`${styles.td} ${styles.tdCenter}`}>{order.lineCount}</td>
                <td className={styles.td}>
                  <CustomerOrderStatusBadge status={order.status} />
                </td>
                <td className={styles.td}>
                  <div className={styles.barWrap}>
                    <div className={styles.barTrack}>
                      <div
                        className={styles.barFillAlloc}
                        style={{ width: `${Math.min(order.allocationPct, 100)}%` }}
                      />
                    </div>
                    <span className={styles.pct}>{order.allocationPct}%</span>
                  </div>
                </td>
                <td className={styles.td}>
                  <div className={styles.barWrap}>
                    <div className={styles.barTrack}>
                      <div
                        className={styles.barFillFulfill}
                        style={{ width: `${Math.min(order.fulfillmentPct, 100)}%` }}
                      />
                    </div>
                    <span className={styles.pct}>{order.fulfillmentPct}%</span>
                  </div>
                </td>
                <td className={`${styles.td} ${styles.due}`}>{order.dueDate ?? "—"}</td>
                <td className={`${styles.td} ${styles.actionsCell}`}>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (
                        confirm(
                          `Delete ${order.orderNumber}? Allocations will also be removed.`,
                        )
                      ) {
                        deleteMutation.mutate(order.id);
                      }
                    }}
                    className={styles.deleteBtn}
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
