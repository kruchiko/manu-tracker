import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import { Layout } from "./shared/components/Layout";
import { pathnameToActivePageId } from "./shared/navigation/pageRoutes";
import { LiveOperationsPage } from "./features/dashboard/components/LiveOperationsPage";
import { JobsPage } from "./features/jobs/components/JobsPage";
import { CustomerOrdersPage } from "./features/customer-orders/components/CustomerOrdersPage";
import { StationsPage } from "./features/stations/components/StationsPage";
import { PipelinesPage } from "./features/pipelines/components/PipelinesPage";

export function App() {
  const location = useLocation();
  const activePageId = pathnameToActivePageId(location.pathname, location.search);

  return (
    <Layout activePageId={activePageId}>
      <Routes>
        <Route path="/" element={<Navigate to="/stations" replace />} />
        <Route path="/live-operations" element={<LiveOperationsPage />} />
        <Route path="/customer-orders" element={<CustomerOrdersPage />} />
        <Route path="/jobs/:jobId?" element={<JobsPage />} />
        <Route path="/stations" element={<StationsPage />} />
        <Route path="/pipelines" element={<PipelinesPage />} />
        <Route path="*" element={<Navigate to="/stations" replace />} />
      </Routes>
    </Layout>
  );
}
