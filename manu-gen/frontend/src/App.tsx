import { Navigate, Route, Routes, useLocation, useNavigate } from "react-router-dom";
import { Layout } from "./shared/components/Layout";
import { DEFAULT_PAGE, pagePath, pathnameToActivePageId } from "./shared/navigation/pageRoutes";
import { ErrorBoundary } from "./shared/components/ErrorBoundary";
import { LiveOperationsPage } from "./features/dashboard/components/LiveOperationsPage";
import { JobsPage } from "./features/jobs/components/JobsPage";
import { CustomerOrdersPage } from "./features/customer-orders/components/CustomerOrdersPage";
import { StationsPage } from "./features/stations/components/StationsPage";
import { PipelinesPage } from "./features/pipelines/components/PipelinesPage";

const defaultPath = pagePath(DEFAULT_PAGE);

export function App() {
  const location = useLocation();
  const navigate = useNavigate();
  const activePageId = pathnameToActivePageId(location.pathname, location.search);

  return (
    <Layout activePageId={activePageId}>
      <ErrorBoundary onRetry={() => navigate(defaultPath, { replace: true })}>
        <Routes>
          <Route path="/" element={<Navigate to={defaultPath} replace />} />
          <Route path={pagePath("live-operations")} element={<LiveOperationsPage />} />
          <Route path={pagePath("customer-orders")} element={<CustomerOrdersPage />} />
          <Route path={`${pagePath("jobs")}/:jobId?`} element={<JobsPage />} />
          <Route path={pagePath("stations")} element={<StationsPage />} />
          <Route path={pagePath("pipelines")} element={<PipelinesPage />} />
          <Route path="*" element={<Navigate to={defaultPath} replace />} />
        </Routes>
      </ErrorBoundary>
    </Layout>
  );
}
