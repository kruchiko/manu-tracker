import { useState } from "react";
import { Layout } from "./shared/components/Layout";
import type { PageId } from "./shared/components/Sidebar";
import { DashboardPage } from "./features/dashboard/components/DashboardPage";
import { OrdersPage } from "./features/orders/components/OrdersPage";
import { StationsPage } from "./features/stations/components/StationsPage";
import { PipelinesPage } from "./features/pipelines/components/PipelinesPage";

export function App() {
  const [currentPage, setCurrentPage] = useState<PageId>("stations");

  return (
    <Layout currentPage={currentPage} onNavigate={setCurrentPage}>
      {currentPage === "dashboard" && <DashboardPage />}
      {currentPage === "orders" && <OrdersPage />}
      {currentPage === "stations" && <StationsPage />}
      {currentPage === "pipelines" && <PipelinesPage />}
    </Layout>
  );
}
