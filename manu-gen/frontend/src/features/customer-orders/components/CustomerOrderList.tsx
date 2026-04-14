import { useMemo, useState } from "react";
import { PackageOpen } from "lucide-react";
import { useCustomerOrders } from "../hooks/useCustomerOrders";
import { useDeleteCustomerOrder } from "../hooks/useDeleteCustomerOrder";
import type { CustomerOrderSummary } from "../customer-orders.types";
import {
  formatOrderLineCount,
  ORDER_FILTER_TABS,
  orderFilteredEmptyHeadline,
  orderFilterSegmentLabel,
  orderMatchesFilter,
  type OrderListFilter,
} from "./customerOrderStatusLabels";
import { CustomerOrderStatusBadge } from "./CustomerOrderStatusBadge";
import styles from "./CustomerOrderList.module.css";

interface CustomerOrderListProps {
  selectedId: number | null;
  onSelect: (order: CustomerOrderSummary) => void;
  /** Shown as secondary CTA in the total-empty state (primary action stays in the page header). */
  onCreateOrder?: () => void;
}

export function CustomerOrderList({
  selectedId,
  onSelect,
  onCreateOrder,
}: CustomerOrderListProps) {
  const { data: ordersData, isLoading, error } = useCustomerOrders();
  const deleteMutation = useDeleteCustomerOrder();
  const [filter, setFilter] = useState<OrderListFilter>("all");

  const orders = useMemo(() => ordersData ?? [], [ordersData]);

  const filteredOrders = useMemo(() => {
    if (!orders.length) return [];
    return orders.filter((o) => orderMatchesFilter(o.status, filter));
  }, [orders, filter]);

  const filteredCount = filteredOrders.length;
  const totalCount = orders.length;

  if (isLoading) return <p className={styles.loading}>Loading orders…</p>;
  if (error) {
    return (
      <p className={styles.error}>Failed to load customer orders: {error.message}</p>
    );
  }

  const listHead = (
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
  );

  if (totalCount === 0) {
    return (
      <div className={styles.listCard}>
        {listHead}
        <div className={styles.emptyState} role="status" aria-live="polite">
          <PackageOpen size={40} strokeWidth={1.5} className={styles.emptyIcon} aria-hidden />
          <h2 className={styles.emptyHeading}>No customer orders yet</h2>
          <p className={styles.emptyText}>
            Create an order to generate jobs per line item. Use{" "}
            <strong className={styles.emptyStrong}>New Order</strong> in the page header to get
            started
            {onCreateOrder ? ", or use the button below." : "."}
          </p>
          {onCreateOrder && (
            <div className={styles.emptyActions}>
              <button type="button" className={styles.emptyCta} onClick={onCreateOrder}>
                New Order
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  if (filteredOrders.length === 0) {
    if (filter === "all") {
      if (import.meta.env.DEV) {
        console.error(
          "[CustomerOrderList] Invariant violated: empty filtered list with filter “all” while orders exist.",
        );
      }
      return (
        <p className={styles.error} role="alert">
          Unable to display the order list. Try refreshing the page.
        </p>
      );
    }

    const statusFilter = filter;
    const segmentLabel = orderFilterSegmentLabel(statusFilter);
    const headline = orderFilteredEmptyHeadline(statusFilter);

    return (
      <div className={styles.listCard}>
        {listHead}
        <div className={styles.emptyState} role="status" aria-live="polite">
          <PackageOpen size={40} strokeWidth={1.5} className={styles.emptyIcon} aria-hidden />
          <h2 className={styles.emptyHeading}>{headline}</h2>
          <p className={styles.emptyText}>
            You have {totalCount} {totalCount === 1 ? "order" : "orders"}, but none match{" "}
            <strong className={styles.emptyStrong}>{segmentLabel}</strong> right now. Try another
            tab, or view all orders.
          </p>
          <div className={styles.emptyActions}>
            <button
              type="button"
              className={styles.emptyCta}
              onClick={() => setFilter("all")}
            >
              View all orders
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.listCard}>
      {listHead}

      <div className={styles.scroll}>
        <table className={styles.table} role="grid">
          <thead>
            <tr className={styles.headerRow}>
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
                <td className={`${styles.td} ${styles.linesCell}`}>
                  {formatOrderLineCount(order.lineCount)}
                </td>
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
