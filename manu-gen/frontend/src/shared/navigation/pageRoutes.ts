/** Top-level app sections (URL segment after `/`, sidebar order is defined in Sidebar). */
export type PageId =
  | "customer-orders"
  | "live-operations"
  | "jobs"
  | "stations"
  | "pipelines";

const ALL_PAGE_IDS: readonly PageId[] = [
  "customer-orders",
  "live-operations",
  "jobs",
  "stations",
  "pipelines",
] as const;

export const DEFAULT_PAGE: PageId = "stations";

/** Query param on `/jobs/:id` when opening a job from Live Operations (sidebar stays on Live Ops). */
/** Query param on `/customer-orders` to open a specific order detail from deep links (e.g. job allocations). */
export const CUSTOMER_ORDER_ID_QUERY = "orderId" as const;

export const JOB_DETAIL_RETURN_FROM_PARAM = "from" as const;

/** Query value paired with {@link JOB_DETAIL_RETURN_FROM_PARAM} for the Live Ops → Jobs handoff. */
export const JOB_DETAIL_RETURN_FROM_LIVE_OPS = "live-operations" as const;

/** Reserved `jobId` segment for the manual-create screen (`/jobs/new`). */
export const JOB_NEW_SEGMENT = "new" as const;

/** Browser path for a top-level app screen (leading slash, no trailing slash). */
export function pagePath(page: PageId): string {
  return `/${page}`;
}

/** Path for creating a job manually (not a numeric job id). */
export function jobNewPath(): string {
  return `${pagePath("jobs")}/${JOB_NEW_SEGMENT}`;
}

export function jobDetailPath(jobId: number): string {
  return `${pagePath("jobs")}/${String(jobId)}`;
}

export function jobDetailUrlFromLiveOperations(jobId: number): string {
  return `${jobDetailPath(jobId)}?${JOB_DETAIL_RETURN_FROM_PARAM}=${JOB_DETAIL_RETURN_FROM_LIVE_OPS}`;
}

export function customerOrderDetailUrl(orderId: number): string {
  return `${pagePath("customer-orders")}?${CUSTOMER_ORDER_ID_QUERY}=${String(orderId)}`;
}

function normalizePathname(pathname: string): string {
  return pathname.length > 1 && pathname.endsWith("/")
    ? pathname.slice(0, -1)
    : pathname;
}

/**
 * Parses a react-router `:jobId` param for `/jobs/:jobId`.
 * Returns null if missing or not a positive integer (job IDs are auto-increment starting from 1).
 */
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

  for (const id of ALL_PAGE_IDS) {
    const prefix = pagePath(id);
    if (path === prefix || path.startsWith(`${prefix}/`)) {
      return id;
    }
  }

  return DEFAULT_PAGE;
}
