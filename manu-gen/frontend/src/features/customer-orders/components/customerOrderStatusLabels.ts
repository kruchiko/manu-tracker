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

/** Tab-aligned copy for filtered-empty body (bold segment name). */
export function orderFilterSegmentLabel(filter: Exclude<OrderListFilter, "all">): string {
  const tab = ORDER_FILTER_TABS.find((t) => t.id === filter);
  return tab?.label ?? filter;
}

/** e.g. "No new orders", "No in-progress orders" — matches segment labels. */
/** UI label for line count; `count` is the stored/API value (unchanged). */
export function formatOrderLineCount(count: number): string {
  const n = Number(count);
  if (!Number.isFinite(n) || n < 0) {
    return "0 lines";
  }
  const i = Math.floor(n);
  return `${i} ${i === 1 ? "line" : "lines"}`;
}

export function orderFilteredEmptyHeadline(filter: Exclude<OrderListFilter, "all">): string {
  switch (filter) {
    case "open":
      return "No new orders";
    case "in_progress":
      return "No in-progress orders";
    case "fulfilled":
      return "No completed orders";
    default: {
      const _exhaustive: never = filter;
      return _exhaustive;
    }
  }
}
