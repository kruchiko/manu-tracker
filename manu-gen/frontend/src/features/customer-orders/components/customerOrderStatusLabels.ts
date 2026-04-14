import type { CustomerOrderStatus } from "../customer-orders.types";

export const ORDER_STATUS_LABEL: Record<CustomerOrderStatus, string> = {
  open: "Open",
  in_progress: "In Progress",
  fulfilled: "Fulfilled",
  cancelled: "Cancelled",
};

/** Toolbar segments — All | New | In Progress | Completed. `cancelled` only visible when filter is `all`. */
export type OrderListFilter = "all" | "open" | "in_progress" | "fulfilled";

export const ORDER_FILTER_TABS: { id: OrderListFilter; label: string }[] = [
  { id: "all", label: "All" },
  { id: "open", label: "New" },
  { id: "in_progress", label: "In Progress" },
  { id: "fulfilled", label: "Completed" },
];

export function orderMatchesFilter(
  status: CustomerOrderStatus,
  filter: OrderListFilter,
): boolean {
  if (filter === "all") return true;
  return status === filter;
}
