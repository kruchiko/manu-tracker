import type { PageId } from "../components/Sidebar";

/** Browser path for a top-level app screen (leading slash, no trailing slash). */
export function pagePath(page: PageId): string {
  return `/${page}`;
}

/**
 * Which sidebar item should appear selected for a given URL.
 * When opening a job from Live Operations, `/jobs/:id?from=live-operations` keeps Live Ops highlighted.
 */
export function pathnameToActivePageId(pathname: string, search: string): PageId {
  const path =
    pathname.length > 1 && pathname.endsWith("/") ? pathname.slice(0, -1) : pathname;
  const q = new URLSearchParams(search);

  if (path.startsWith("/jobs") && q.get("from") === "live-operations") {
    return "live-operations";
  }
  if (path === "/jobs" || path.startsWith("/jobs/")) {
    return "jobs";
  }
  if (path === "/live-operations" || path.startsWith("/live-operations/")) {
    return "live-operations";
  }
  if (path === "/customer-orders" || path.startsWith("/customer-orders/")) {
    return "customer-orders";
  }
  if (path === "/stations" || path.startsWith("/stations/")) {
    return "stations";
  }
  if (path === "/pipelines" || path.startsWith("/pipelines/")) {
    return "pipelines";
  }
  return "stations";
}
