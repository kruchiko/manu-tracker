import { useState } from "react";
import { Plus } from "lucide-react";
import { PageHeader } from "../../../shared/components/PageHeader";
import { CustomerOrderForm } from "./CustomerOrderForm";
import { CustomerOrderList } from "./CustomerOrderList";
import { CustomerOrderDetail } from "./CustomerOrderDetail";
import styles from "./CustomerOrdersPage.module.css";

type OrdersView = "list" | "create";

export function CustomerOrdersPage() {
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [ordersView, setOrdersView] = useState<OrdersView>("list");

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

      <CustomerOrderList
        selectedId={selectedId}
        onSelect={(order) => setSelectedId(order.id)}
      />
    </div>
  );
}
