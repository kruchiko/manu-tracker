import type { CustomerOrderStatus } from "../customer-orders.types";
import { ORDER_STATUS_LABEL } from "./customerOrderStatusLabels";
import styles from "./CustomerOrderStatusBadge.module.css";

function statusClass(status: CustomerOrderStatus): string {
  if (status === "open") return styles.open;
  if (status === "in_progress") return styles.inProgress;
  if (status === "fulfilled") return styles.fulfilled;
  return styles.cancelled;
}

interface CustomerOrderStatusBadgeProps {
  status: CustomerOrderStatus;
}

export function CustomerOrderStatusBadge({ status }: CustomerOrderStatusBadgeProps) {
  return (
    <span className={`${styles.badge} ${statusClass(status)}`}>
      {ORDER_STATUS_LABEL[status]}
    </span>
  );
}
