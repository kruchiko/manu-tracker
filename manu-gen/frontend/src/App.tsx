import { useState } from "react";
import { Layout } from "./shared/components/Layout";
import type { PageId } from "./shared/components/Sidebar";
import { LiveOperationsPage } from "./features/dashboard/components/LiveOperationsPage";
import { JobsPage } from "./features/jobs/components/JobsPage";
import { CustomerOrdersPage } from "./features/customer-orders/components/CustomerOrdersPage";
import { StationsPage } from "./features/stations/components/StationsPage";
import { PipelinesPage } from "./features/pipelines/components/PipelinesPage";

export function App() {
  const [currentPage, setCurrentPage] = useState<PageId>("stations");

  return (
    <Layout currentPage={currentPage} onNavigate={setCurrentPage}>
      {currentPage === "customer-orders" && (
        <CustomerOrdersPage onNavigateToPipelines={() => setCurrentPage("pipelines")} />
      )}
      {currentPage === "live-operations" && <LiveOperationsPage />}
      {currentPage === "jobs" && <JobsPage />}
      {currentPage === "stations" && <StationsPage />}
      {currentPage === "pipelines" && <PipelinesPage />}
    </Layout>
  );
}
