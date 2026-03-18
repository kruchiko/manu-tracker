import { useState } from "react";
import { Layout } from "./shared/components/Layout";
import type { PageId } from "./shared/components/Sidebar";
import { OrdersPage } from "./features/orders/components/OrdersPage";
import { StationsPage } from "./features/stations/components/StationsPage";

export function App() {
  const [currentPage, setCurrentPage] = useState<PageId>("orders");

  return (
    <Layout currentPage={currentPage} onNavigate={setCurrentPage}>
      {currentPage === "orders" && <OrdersPage />}
      {currentPage === "stations" && <StationsPage />}
    </Layout>
  );
}
