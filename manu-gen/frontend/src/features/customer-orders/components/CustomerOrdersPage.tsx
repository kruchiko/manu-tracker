import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Plus } from "lucide-react";
import { pagePath } from "../../../shared/navigation/pageRoutes";
import { PageHeader } from "../../../shared/components/PageHeader";
import pageShell from "../../../shared/components/PageShell.module.css";
import sectionPanel from "../../../shared/components/SectionPanel.module.css";
import { useOrderMetrics } from "../../../shared/hooks/useOrderMetrics";
import { CustomerOrderForm } from "./CustomerOrderForm";
import { CustomerOrderList } from "./CustomerOrderList";
import { CustomerOrderDetail } from "./CustomerOrderDetail";
import styles from "./CustomerOrdersPage.module.css";

type OrdersView = "list" | "create";

export function CustomerOrdersPage() {
  const navigate = useNavigate();
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [ordersView, setOrdersView] = useState<OrdersView>("list");

  const orderMetricsEnabled = selectedId === null && ordersView === "list";
  const {
    data: orderMetrics,
    isLoading: orderMetricsLoading,
    isError: orderMetricsIsError,
    error: orderMetricsError,
  } = useOrderMetrics({ enabled: orderMetricsEnabled });

  const showMetricsError = orderMetricsIsError;
  const showMetricsLoading = !orderMetricsIsError && orderMetricsLoading;
  const showMetricsData =
    !orderMetricsIsError && !orderMetricsLoading && orderMetrics != null;
  const hasOverviewContent = showMetricsError || showMetricsLoading || showMetricsData;

  if (selectedId !== null) {
    return (
      <div className={pageShell.column}>
        <CustomerOrderDetail orderId={selectedId} onBack={() => setSelectedId(null)} />
      </div>
    );
  }

  if (ordersView === "create") {
    return (
      <div className={pageShell.column}>
        <CustomerOrderForm
          onCreated={(order) => {
            setOrdersView("list");
            setSelectedId(order.id);
          }}
          onCancel={() => setOrdersView("list")}
          onNavigateToPipelines={() => navigate(pagePath("pipelines"))}
        />
      </div>
    );
  }

  return (
    <div className={pageShell.column}>
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

      {hasOverviewContent && (
        <div className={styles.overview}>
          {showMetricsError && (
            <div className={styles.metricsError} role="alert">
              Could not load order metrics: {orderMetricsError?.message ?? "Unknown error"}
            </div>
          )}

          {showMetricsLoading && (
            <div className={styles.metricsGrid} aria-busy="true" aria-label="Loading order metrics">
              <div className={styles.metricSkeleton} />
              <div className={styles.metricSkeleton} />
              <div className={styles.metricSkeleton} />
            </div>
          )}

          {showMetricsData && orderMetrics ? (
            <div className={styles.metricsGrid}>
              <div className={`${sectionPanel.surface} ${sectionPanel.paddingCompact}`}>
                <p className={styles.metricLabel}>Total Orders</p>
                <p className={styles.metricValue}>{orderMetrics.totalOrders}</p>
              </div>
              <div className={`${sectionPanel.surface} ${sectionPanel.paddingCompact}`}>
                <p className={styles.metricLabel}>Fulfilled</p>
                <p className={`${styles.metricValue} ${styles.metricValueOk}`}>
                  {orderMetrics.fulfilledOrders}
                </p>
              </div>
              <div className={`${sectionPanel.surface} ${sectionPanel.paddingCompact}`}>
                <p className={styles.metricLabel}>Avg Jobs / Order</p>
                <p className={styles.metricValue}>{orderMetrics.avgJobsPerOrder}</p>
              </div>
            </div>
          ) : null}
        </div>
      )}

      <CustomerOrderList
        selectedId={selectedId}
        onSelect={(order) => setSelectedId(order.id)}
        onCreateOrder={() => setOrdersView("create")}
      />
    </div>
  );
}
