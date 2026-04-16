import { useState } from "react";
import { Plus } from "lucide-react";
import { PageHeader } from "../../../shared/components/PageHeader";
import { CustomerOrderForm } from "./CustomerOrderForm";
import { CustomerOrderList } from "./CustomerOrderList";
import { CustomerOrderDetail } from "./CustomerOrderDetail";
import { useOrderMetrics } from "../../dashboard/hooks/useOrderMetrics";
import styles from "./CustomerOrdersPage.module.css";

type OrdersView = "list" | "create";

interface CustomerOrdersPageProps {
  /** Opens the Pipelines page (e.g. from “create one” on a line with no pipeline). */
  onNavigateToPipelines?: () => void;
}

export function CustomerOrdersPage({ onNavigateToPipelines }: CustomerOrdersPageProps) {
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [ordersView, setOrdersView] = useState<OrdersView>("list");
  const { data: orderMetrics } = useOrderMetrics();

  if (selectedId !== null) {
    return (
      <div className={styles.page}>
        <CustomerOrderDetail orderId={selectedId} onBack={() => setSelectedId(null)} />
      </div>
    );
  }

  if (ordersView === "create") {
    return (
      <div className={styles.page}>
        <CustomerOrderForm
          onCreated={(order) => {
            setOrdersView("list");
            setSelectedId(order.id);
          }}
          onCancel={() => setOrdersView("list")}
          onNavigateToPipelines={onNavigateToPipelines}
        />
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <PageHeader
        title="Customer Orders"
        subtitle="Create and manage orders — jobs are auto-generated per line item on save"
        action={
          <button
            type="button"
            className={styles.newOrderBtn}
            onClick={() => setOrdersView("create")}
          >
            <Plus size={13} strokeWidth={2} aria-hidden />
            New Order
          </button>
        }
      />

      <div className={styles.overview}>
        {orderMetrics && (
          <div className={styles.metricsGrid}>
            <div className={styles.metricCard}>
              <p className={styles.metricLabel}>Total Orders</p>
              <p className={styles.metricValue}>{orderMetrics.totalOrders}</p>
            </div>
            <div className={styles.metricCard}>
              <p className={styles.metricLabel}>Fulfilled</p>
              <p className={`${styles.metricValue} ${styles.metricValueOk}`}>
                {orderMetrics.fulfilledOrders}
              </p>
            </div>
            <div className={styles.metricCard}>
              <p className={styles.metricLabel}>Avg Jobs / Order</p>
              <p className={styles.metricValue}>{orderMetrics.avgJobsPerOrder}</p>
            </div>
          </div>
        )}
      </div>

      <CustomerOrderList
        selectedId={selectedId}
        onSelect={(order) => setSelectedId(order.id)}
        onCreateOrder={() => setOrdersView("create")}
      />
    </div>
  );
}
