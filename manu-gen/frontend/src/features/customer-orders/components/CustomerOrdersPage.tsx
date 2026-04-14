import { useState } from "react";
import { Plus } from "lucide-react";
import { PageHeader } from "../../../shared/components/PageHeader";
import { CustomerOrderForm } from "./CustomerOrderForm";
import { CustomerOrderList } from "./CustomerOrderList";
import { CustomerOrderDetail } from "./CustomerOrderDetail";
import styles from "./CustomerOrdersPage.module.css";

export function CustomerOrdersPage() {
  const [selectedId, setSelectedId] = useState<number | null>(null);

  function scrollToNewForm() {
    document.getElementById("new-customer-order-form")?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  return (
    <div className={styles.page}>
      {selectedId !== null ? (
        <CustomerOrderDetail orderId={selectedId} onBack={() => setSelectedId(null)} />
      ) : (
        <>
          <PageHeader
            title="Customer Orders"
            subtitle="Create and manage orders — jobs are auto-generated per line item on save"
            action={
              <button type="button" className={styles.newOrderBtn} onClick={scrollToNewForm}>
                <Plus size={13} strokeWidth={2} aria-hidden />
                New Order
              </button>
            }
          />

          <div id="new-customer-order-form" className={styles.formSection}>
            <div className={styles.formCard}>
              <h2 className={styles.formTitle}>New Customer Order</h2>
              <CustomerOrderForm onCreated={(order) => setSelectedId(order.id)} />
            </div>
          </div>

          <CustomerOrderList
            selectedId={selectedId}
            onSelect={(order) => setSelectedId(order.id)}
          />
        </>
      )}
    </div>
  );
}
