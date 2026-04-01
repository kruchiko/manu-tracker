import { useState } from "react";
import { useCustomerOrder } from "../hooks/useCustomerOrder";
import { useAddAllocation } from "../hooks/useAddAllocation";
import { useRemoveAllocation } from "../hooks/useRemoveAllocation";
import { useJobs } from "../../jobs/hooks/useJobs";
import type { OrderLine } from "../customer-orders.types";

const STATUS_LABELS: Record<string, string> = {
  open: "Open",
  in_progress: "In Progress",
  fulfilled: "Fulfilled",
  cancelled: "Cancelled",
};

const STATUS_COLORS: Record<string, string> = {
  open: "bg-blue-100 text-blue-800",
  in_progress: "bg-yellow-100 text-yellow-800",
  fulfilled: "bg-green-100 text-green-800",
  cancelled: "bg-gray-100 text-gray-600",
};

interface CustomerOrderDetailProps {
  orderId: number;
  onBack: () => void;
  readonly?: boolean;
}

function AllocationRow({
  alloc,
  onRemove,
  removing,
}: {
  alloc: OrderLine["allocations"][number];
  onRemove: () => void;
  removing: boolean;
}) {
  return (
    <div className="flex items-center justify-between rounded border bg-gray-50 px-3 py-2">
      <div className="flex items-center gap-3">
        <span className="font-mono text-xs text-gray-700">{alloc.jobNumber}</span>
        <span className="text-sm text-gray-500">{alloc.quantity} items</span>
      </div>
      <button
        type="button"
        onClick={onRemove}
        disabled={removing}
        className="text-xs text-red-600 hover:text-red-800 disabled:opacity-50"
      >
        Remove
      </button>
    </div>
  );
}

function LineHeader({ line }: { line: OrderLine }) {
  const pct =
    line.quantity > 0
      ? Math.round(
          (Math.min(line.allocatedQuantity, line.quantity) / line.quantity) *
            100,
        )
      : 0;

  return (
    <div className="mb-3 flex items-center justify-between">
      <div>
        <h5 className="font-medium text-gray-900">{line.productType}</h5>
        <p className="text-xs text-gray-500">
          {line.allocatedQuantity} / {line.quantity} allocated
          {line.fulfilledQuantity > 0 && (
            <span className="ml-2 text-green-700">
              ({line.fulfilledQuantity} fulfilled)
            </span>
          )}
        </p>
      </div>
      <div className="flex items-center gap-2">
        <div className="h-2 w-20 rounded-full bg-gray-200">
          <div
            className="h-2 rounded-full bg-blue-600 transition-all"
            style={{ width: `${pct}%` }}
          />
        </div>
        <span className="text-xs font-medium text-gray-600">{pct}%</span>
      </div>
    </div>
  );
}

function ReadOnlyLineCard({ line }: { line: OrderLine }) {
  return (
    <div className="rounded-lg border bg-white p-4 shadow-sm">
      <LineHeader line={line} />
      {line.allocations.length > 0 ? (
        <div className="flex flex-col gap-1.5">
          <p className="text-xs font-medium uppercase text-gray-400">Linked Jobs</p>
          {line.allocations.map((alloc) => (
            <div key={alloc.id} className="flex items-center gap-3 rounded border bg-gray-50 px-3 py-2">
              <span className="font-mono text-xs text-gray-700">{alloc.jobNumber}</span>
              <span className="text-sm text-gray-500">{alloc.quantity} items</span>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-xs italic text-gray-400">No jobs allocated yet</p>
      )}
    </div>
  );
}

function EditableLineCard({ line }: { line: OrderLine }) {
  const { data: jobs } = useJobs();
  const { mutate: addAlloc, isPending: adding } = useAddAllocation();
  const { mutate: removeAlloc, isPending: removing } = useRemoveAllocation();
  const [jobId, setJobId] = useState("");
  const [qty, setQty] = useState("");
  const [error, setError] = useState<string | null>(null);

  const allocatedJobIds = new Set(line.allocations.map((a) => a.jobId));
  const availableJobs = (jobs ?? [])
    .map((j) => ({ ...j, available: j.quantity - j.allocatedQuantity }))
    .filter((j) => j.productType === line.productType && !allocatedJobIds.has(j.id) && j.available > 0);

  const selectedJob = availableJobs.find((j) => j.id === Number(jobId));
  const maxQty = selectedJob?.available ?? 0;
  const remaining = Math.max(line.quantity - line.allocatedQuantity, 0);
  const effectiveMax = maxQty > 0 ? Math.min(maxQty, remaining > 0 ? remaining : maxQty) : 0;

  function handleAdd() {
    setError(null);
    const parsedJobId = Number(jobId);
    const parsedQty = Number(qty);
    if (!parsedJobId || !parsedQty || parsedQty < 1) {
      setError("Select a job and enter a valid quantity");
      return;
    }
    if (parsedQty > effectiveMax) {
      setError(`Max allocatable quantity is ${effectiveMax}`);
      return;
    }
    addAlloc(
      { jobId: parsedJobId, orderLineId: line.id, quantity: parsedQty },
      {
        onSuccess: () => { setJobId(""); setQty(""); },
        onError: (err) => setError(err.message),
      },
    );
  }

  return (
    <div className="rounded-lg border bg-white p-4 shadow-sm">
      <LineHeader line={line} />

      {line.allocations.length > 0 && (
        <div className="mb-3 flex flex-col gap-1.5">
          <p className="text-xs font-medium uppercase text-gray-400">Linked Jobs</p>
          {line.allocations.map((alloc) => (
            <AllocationRow
              key={alloc.id}
              alloc={alloc}
              removing={removing}
              onRemove={() => removeAlloc({ jobId: alloc.jobId, allocationId: alloc.id })}
            />
          ))}
        </div>
      )}

      <div className="mt-2">
        <div className="flex items-end gap-2">
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-gray-500">Job</label>
            <select
              value={jobId}
              onChange={(e) => { setJobId(e.target.value); setQty(""); setError(null); }}
              className="rounded border px-2 py-1.5 text-sm"
            >
              <option value="">Select job...</option>
              {availableJobs.map((j) => (
                <option key={j.id} value={j.id}>
                  {j.jobNumber} — {j.productType} ({j.available} avail)
                </option>
              ))}
            </select>
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-gray-500">
              Qty {effectiveMax > 0 && <span className="text-gray-400">(max {effectiveMax})</span>}
            </label>
            <input
              type="number"
              min={1}
              max={effectiveMax}
              value={qty}
              onChange={(e) => setQty(e.target.value)}
              className="w-20 rounded border px-2 py-1.5 text-sm"
              placeholder="0"
              disabled={!selectedJob}
            />
          </div>
          <button
            type="button"
            onClick={handleAdd}
            disabled={adding || !selectedJob}
            className="rounded bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {adding ? "Adding..." : "Allocate"}
          </button>
        </div>
        {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
      </div>
    </div>
  );
}

export function CustomerOrderDetail({
  orderId,
  onBack,
  readonly: isReadonly,
}: CustomerOrderDetailProps) {
  const { data: order, isLoading, error } = useCustomerOrder(orderId);

  if (isLoading) return <p className="text-sm text-gray-500">Loading...</p>;
  if (error)
    return <p className="text-sm text-red-600">Error: {error.message}</p>;
  if (!order) return null;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-sm font-medium text-gray-600 hover:bg-gray-100 hover:text-gray-900"
        >
          <svg
            className="h-4 w-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M15 19l-7-7 7-7"
            />
          </svg>
          Back
        </button>
        <h3 className="text-lg font-semibold">
          {order.orderNumber} &mdash; {order.customerName}
        </h3>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-5">
        <div className="rounded-lg border bg-white p-4 shadow-sm">
          <p className="text-xs font-medium uppercase text-gray-500">Status</p>
          <p className="mt-1">
            <span
              className={`inline-block rounded-full px-2 py-0.5 text-sm font-semibold ${STATUS_COLORS[order.status] ?? ""}`}
            >
              {STATUS_LABELS[order.status] ?? order.status}
            </span>
          </p>
        </div>
        <div className="rounded-lg border bg-white p-4 shadow-sm">
          <p className="text-xs font-medium uppercase text-gray-500">
            Allocated
          </p>
          <p className="mt-1 text-lg font-semibold">{order.allocationPct}%</p>
        </div>
        <div className="rounded-lg border bg-white p-4 shadow-sm">
          <p className="text-xs font-medium uppercase text-gray-500">
            Fulfilled
          </p>
          <p className="mt-1 text-lg font-semibold">{order.fulfillmentPct}%</p>
        </div>
        <div className="rounded-lg border bg-white p-4 shadow-sm">
          <p className="text-xs font-medium uppercase text-gray-500">Lines</p>
          <p className="mt-1 text-lg font-semibold">{order.lines.length}</p>
        </div>
        <div className="rounded-lg border bg-white p-4 shadow-sm">
          <p className="text-xs font-medium uppercase text-gray-500">Due</p>
          <p className="mt-1 text-lg font-semibold">
            {order.dueDate ?? "---"}
          </p>
        </div>
      </div>

      <div>
        <h4 className="mb-3 text-sm font-semibold uppercase text-gray-500">
          Line Items &amp; Job Allocations
        </h4>
        <div className="flex flex-col gap-4">
          {order.lines.map((line) =>
            isReadonly ? (
              <ReadOnlyLineCard key={line.id} line={line} />
            ) : (
              <EditableLineCard key={line.id} line={line} />
            ),
          )}
        </div>
      </div>

      {order.notes && (
        <div className="rounded-lg border bg-white p-6 shadow-sm">
          <h4 className="mb-2 text-sm font-semibold uppercase text-gray-500">
            Notes
          </h4>
          <p className="text-sm text-gray-700">{order.notes}</p>
        </div>
      )}
    </div>
  );
}
