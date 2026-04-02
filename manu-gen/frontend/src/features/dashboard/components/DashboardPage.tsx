import { useState, useRef, useEffect } from "react";
import { GlobalOverview } from "./GlobalOverview";
import { JobDetailView } from "./JobDetailView";
import { useJobBoard } from "../hooks/useJobBoard";
import { OverviewVisibleContext } from "../OverviewVisibleContext";
import { CustomerOrderList } from "../../customer-orders/components/CustomerOrderList";
import { CustomerOrderDetail } from "../../customer-orders/components/CustomerOrderDetail";
import { useOrderMetrics } from "../hooks/useOrderMetrics";

type DashboardTab = "customer-orders" | "operations";

export function DashboardPage() {
  const [tab, setTab] = useState<DashboardTab>("customer-orders");
  const [selectedJobId, setSelectedJobId] = useState<number | null>(null);
  const [selectedCustomerOrderId, setSelectedCustomerOrderId] = useState<number | null>(null);
  const { data: jobs } = useJobBoard();
  const { data: orderMetrics } = useOrderMetrics();
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
          <div className="space-y-6">
            {orderMetrics && (
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                <div className="rounded-lg border bg-white p-4 shadow-sm">
                  <p className="text-xs font-medium uppercase text-gray-500">Total Orders</p>
                  <p className="mt-1 text-2xl font-bold text-gray-900">{orderMetrics.totalOrders}</p>
                </div>
                <div className="rounded-lg border bg-white p-4 shadow-sm">
                  <p className="text-xs font-medium uppercase text-gray-500">Fulfilled</p>
                  <p className="mt-1 text-2xl font-bold text-green-700">{orderMetrics.fulfilledOrders}</p>
                </div>
                <div className="rounded-lg border bg-white p-4 shadow-sm">
                  <p className="text-xs font-medium uppercase text-gray-500">Avg Jobs / Order</p>
                  <p className="mt-1 text-2xl font-bold text-gray-900">{orderMetrics.avgJobsPerOrder}</p>
                </div>
                <div className="rounded-lg border bg-white p-4 shadow-sm">
                  <p className="text-xs font-medium uppercase text-gray-500">Product Types</p>
                  <p className="mt-1 text-2xl font-bold text-gray-900">{orderMetrics.byProductType.length}</p>
                </div>
              </div>
            )}

            {orderMetrics && orderMetrics.byProductType.length > 0 && (
              <div className="rounded-lg border bg-white p-6 shadow-sm">
                <h3 className="mb-3 text-sm font-semibold text-gray-900">Fulfillment by Product Type</h3>
                <div className="space-y-2">
                  {orderMetrics.byProductType.map((pt) => {
                    const pct = pt.totalQuantity > 0 ? Math.round((pt.fulfilledQuantity / pt.totalQuantity) * 100) : 0;
                    return (
                      <div key={pt.productType} className="flex items-center gap-3">
                        <span className="w-24 truncate text-sm font-medium text-gray-700">{pt.productType}</span>
                        <div className="flex h-2 flex-1 overflow-hidden rounded-full bg-gray-200">
                          <div
                            className="rounded-full bg-green-500 transition-all"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                        <span className="w-20 text-right text-xs text-gray-500">
                          {pt.fulfilledQuantity}/{pt.totalQuantity} ({pct}%)
                        </span>
                        <span className="w-16 text-right text-xs text-gray-400">
                          {pt.jobCount} job{pt.jobCount !== 1 ? "s" : ""}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            <div className="rounded-lg border bg-white p-6 shadow-sm">
              <h3 className="mb-4 text-lg font-semibold">Customer Orders</h3>
              <CustomerOrderList
                selectedId={selectedCustomerOrderId}
                onSelect={(order) => setSelectedCustomerOrderId(order.id)}
              />
            </div>
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
