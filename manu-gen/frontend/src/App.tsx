import { useCallback, useState } from "react";
import { Layout } from "./shared/components/Layout";
import type { PageId } from "./shared/components/Sidebar";
import { LiveOperationsPage } from "./features/dashboard/components/LiveOperationsPage";
import { JobsPage } from "./features/jobs/components/JobsPage";
import { CustomerOrdersPage } from "./features/customer-orders/components/CustomerOrdersPage";
import { StationsPage } from "./features/stations/components/StationsPage";
import { PipelinesPage } from "./features/pipelines/components/PipelinesPage";

export function App() {
  const [currentPage, setCurrentPage] = useState<PageId>("stations");
  const [jobsBootstrapJobId, setJobsBootstrapJobId] = useState<number | null>(null);
  /** When opening a job from Live Operations, detail back returns there instead of the Jobs list. */
  const [jobDetailReturnTo, setJobDetailReturnTo] = useState<"live-operations" | null>(null);

  const navigateToPage = useCallback((page: PageId) => {
    if (page !== "jobs") {
      setJobsBootstrapJobId(null);
      setJobDetailReturnTo(null);
    }
    setCurrentPage(page);
  }, []);

  const handleJobsBootstrapConsumed = useCallback(() => {
    setJobsBootstrapJobId(null);
  }, []);

  const handleJobBootstrapFailed = useCallback(() => {
    setJobsBootstrapJobId(null);
    setJobDetailReturnTo(null);
  }, []);

  const handleExitJobDetailToLiveOperations = useCallback(() => {
    navigateToPage("live-operations");
  }, [navigateToPage]);

  const sidebarActivePage =
    currentPage === "jobs" && jobDetailReturnTo === "live-operations"
      ? ("live-operations" as const)
      : undefined;

  return (
    <Layout
      currentPage={currentPage}
      sidebarActivePage={sidebarActivePage}
      onNavigate={navigateToPage}
    >
      {currentPage === "customer-orders" && (
        <CustomerOrdersPage onNavigateToPipelines={() => navigateToPage("pipelines")} />
      )}
      {currentPage === "live-operations" && (
        <LiveOperationsPage
          onOpenJobDetail={(jobId) => {
            setJobsBootstrapJobId(jobId);
            setJobDetailReturnTo("live-operations");
            navigateToPage("jobs");
          }}
        />
      )}
      {currentPage === "jobs" && (
        <JobsPage
          initialDetailJobId={jobsBootstrapJobId}
          onInitialDetailConsumed={handleJobsBootstrapConsumed}
          onJobBootstrapFailed={handleJobBootstrapFailed}
          jobDetailReturnTo={jobDetailReturnTo}
          onExitJobDetailToLiveOperations={handleExitJobDetailToLiveOperations}
        />
      )}
      {currentPage === "stations" && <StationsPage />}
      {currentPage === "pipelines" && <PipelinesPage />}
    </Layout>
  );
}
