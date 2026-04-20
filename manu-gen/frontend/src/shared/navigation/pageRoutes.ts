/** Top-level app sections (URL segment after `/`, sidebar order is defined in Sidebar). */
export type PageId =
  | "customer-orders"
  | "live-operations"
  | "jobs"
  | "stations"
  | "pipelines";

/** Query key on `/jobs/:id` when opening a job from Live Operations (sidebar stays on Live Ops). */
export const JOB_DETAIL_RETURN_FROM_PARAM = "from" as const;

/** Query value paired with {@link JOB_DETAIL_RETURN_FROM_PARAM} for the Live Ops → Jobs handoff. */
export const JOB_DETAIL_RETURN_FROM_LIVE_OPS = "live-operations" as const;

export function jobDetailUrlFromLiveOperations(jobId: number): string {
  return `/jobs/${jobId}?${JOB_DETAIL_RETURN_FROM_PARAM}=${JOB_DETAIL_RETURN_FROM_LIVE_OPS}`;
}

function normalizePathname(pathname: string): string {
  return pathname.length > 1 && pathname.endsWith("/")
    ? pathname.slice(0, -1)
    : pathname;
}

/** Parses a `react-router` `:jobId` param for `/jobs/:jobId`. Returns null if missing or not a positive integer. */
export function parseJobsJobIdParam(jobIdParam: string | undefined): number | null {
  if (!jobIdParam || !/^\d+$/.test(jobIdParam)) return null;
  const n = Number(jobIdParam);
  if (!Number.isSafeInteger(n) || n < 1) return null;
  return n;
}

/**
 * Numeric job id when the pathname is exactly `/jobs/:id` (single segment after jobs).
 * Used to decide Live Ops sidebar highlight (requires a real job path, not `/jobs` alone).
 */
export function parseJobsDetailJobIdFromPathname(pathname: string): number | null {
  const path = normalizePathname(pathname);
  const m = path.match(/^\/jobs\/([^/]+)$/);
  if (!m) return null;
  return parseJobsJobIdParam(m[1]);
}

/** Browser path for a top-level app screen (leading slash, no trailing slash). */
export function pagePath(page: PageId): string {
  return `/${page}`;
}

/**
 * Which sidebar item should appear selected for a given URL.
 * When opening a job from Live Operations, `/jobs/:id?from=live-operations` keeps Live Ops highlighted.
 */
export function pathnameToActivePageId(pathname: string, search: string): PageId {
  const path = normalizePathname(pathname);
  const q = new URLSearchParams(search);

  const jobsDetailId = parseJobsDetailJobIdFromPathname(path);
  if (
    jobsDetailId != null &&
    q.get(JOB_DETAIL_RETURN_FROM_PARAM) === JOB_DETAIL_RETURN_FROM_LIVE_OPS
  ) {
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
