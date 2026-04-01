import { useState, useRef, useEffect } from "react";
import { GlobalOverview } from "./GlobalOverview";
import { JobDetailView } from "./JobDetailView";
import { useJobBoard } from "../hooks/useJobBoard";
import { OverviewVisibleContext } from "../OverviewVisibleContext";
import { CustomerOrderList } from "../../customer-orders/components/CustomerOrderList";
import { CustomerOrderDetail } from "../../customer-orders/components/CustomerOrderDetail";

type DashboardTab = "customer-orders" | "operations";

export function DashboardPage() {
  const [tab, setTab] = useState<DashboardTab>("customer-orders");
  const [selectedJobId, setSelectedJobId] = useState<number | null>(null);
  const [selectedCustomerOrderId, setSelectedCustomerOrderId] = useState<number | null>(null);
  const { data: jobs } = useJobBoard();
  const selectedJob = jobs?.find((j) => j.id === selectedJobId) ?? null;
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    containerRef.current?.scrollTo({ top: 0 });
  }, [selectedJobId, selectedCustomerOrderId]);

  const drilled = tab === "operations" && selectedJob !== null;

  return (
    <div ref={containerRef} className="overflow-hidden">
      <h2 className="mb-4 text-xl font-semibold text-gray-900">Dashboard</h2>

      <div className="mb-6 flex gap-1 rounded-lg border bg-gray-100 p-1">
        <button
          onClick={() => { setTab("customer-orders"); setSelectedJobId(null); }}
          className={`rounded-md px-4 py-2 text-sm font-medium transition-colors ${
            tab === "customer-orders"
              ? "bg-white text-gray-900 shadow-sm"
              : "text-gray-500 hover:text-gray-700"
          }`}
        >
          Customer Orders
        </button>
        <button
          onClick={() => { setTab("operations"); setSelectedCustomerOrderId(null); }}
          className={`rounded-md px-4 py-2 text-sm font-medium transition-colors ${
            tab === "operations"
              ? "bg-white text-gray-900 shadow-sm"
              : "text-gray-500 hover:text-gray-700"
          }`}
        >
          Internal Operations
        </button>
      </div>

      {tab === "customer-orders" && (
        selectedCustomerOrderId !== null ? (
          <CustomerOrderDetail
            orderId={selectedCustomerOrderId}
            onBack={() => setSelectedCustomerOrderId(null)}
            readonly
          />
        ) : (
          <div className="rounded-lg border bg-white p-6 shadow-sm">
            <h3 className="mb-4 text-lg font-semibold">Customer Orders</h3>
            <CustomerOrderList
              selectedId={selectedCustomerOrderId}
              onSelect={(order) => setSelectedCustomerOrderId(order.id)}
            />
          </div>
        )
      )}

      {tab === "operations" && (
        <div className="relative">
          <div
            className="flex transition-transform duration-300 ease-in-out"
            style={{ transform: drilled ? "translateX(-100%)" : "translateX(0)" }}
          >
            <div className="w-full shrink-0">
              <OverviewVisibleContext.Provider value={!drilled}>
                <GlobalOverview
                  selectedJobId={selectedJobId}
                  onSelectJob={(job) => setSelectedJobId(job.id)}
                />
              </OverviewVisibleContext.Provider>
            </div>

            <div className="w-full shrink-0">
              {selectedJob && (
                <JobDetailView
                  job={selectedJob}
                  onBack={() => setSelectedJobId(null)}
                />
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
