import { useState } from "react";
import { ChevronLeft } from "lucide-react";
import { useCustomerOrder } from "../hooks/useCustomerOrder";
import { useAddAllocation } from "../hooks/useAddAllocation";
import { useRemoveAllocation } from "../hooks/useRemoveAllocation";
import { useJobs } from "../../jobs/hooks/useJobs";
import type { OrderLine } from "../customer-orders.types";
import { CustomerOrderStatusBadge } from "./CustomerOrderStatusBadge";
import styles from "./CustomerOrderDetail.module.css";

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
    <div className={styles.allocRow}>
      <div>
        <span className={styles.allocMono}>{alloc.jobNumber}</span>
        <span className={styles.allocQty}> · {alloc.quantity} items</span>
      </div>
      <button
        type="button"
        onClick={onRemove}
        disabled={removing}
        className={styles.removeLink}
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
          (Math.min(line.allocatedQuantity, line.quantity) / line.quantity) * 100,
        )
      : 0;

  return (
    <div className={styles.lineHeader}>
      <div>
        <h5 className={styles.lineTitle}>{line.productType}</h5>
        <p className={styles.lineMeta}>
          {line.allocatedQuantity} / {line.quantity} allocated
          {line.fulfilledQuantity > 0 && (
            <span className={styles.fulfilled}>
              ({line.fulfilledQuantity} fulfilled)
            </span>
          )}
        </p>
      </div>
      <div className={styles.barRow}>
        <div className={styles.barTrack}>
          <div className={styles.barFill} style={{ width: `${pct}%` }} />
        </div>
        <span className={styles.pct}>{pct}%</span>
      </div>
    </div>
  );
}

function ReadOnlyLineCard({ line }: { line: OrderLine }) {
  return (
    <div className={styles.lineCard}>
      <LineHeader line={line} />
      {line.allocations.length > 0 ? (
        <div>
          <p className={styles.linkedLabel}>Linked Jobs</p>
          {line.allocations.map((alloc) => (
            <div key={alloc.id} className={styles.allocRow}>
              <span className={styles.allocMono}>{alloc.jobNumber}</span>
              <span className={styles.allocQty}>{alloc.quantity} items</span>
            </div>
          ))}
        </div>
      ) : (
        <p className={styles.emptyAlloc}>No jobs allocated yet</p>
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
    .filter(
      (j) =>
        j.productType === line.productType &&
        !allocatedJobIds.has(j.id) &&
        j.available > 0,
    );

  const selectedJob = availableJobs.find((j) => j.id === Number(jobId));
  const maxQty = selectedJob?.available ?? 0;
  const remaining = Math.max(line.quantity - line.allocatedQuantity, 0);
  const effectiveMax =
    maxQty > 0 ? Math.min(maxQty, remaining > 0 ? remaining : maxQty) : 0;

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
        onSuccess: () => {
          setJobId("");
          setQty("");
        },
        onError: (err) => setError(err.message),
      },
    );
  }

  return (
    <div className={styles.lineCard}>
      <LineHeader line={line} />

      {line.allocations.length > 0 && (
        <div>
          <p className={styles.linkedLabel}>Linked Jobs</p>
          {line.allocations.map((alloc) => (
            <AllocationRow
              key={alloc.id}
              alloc={alloc}
              removing={removing}
              onRemove={() =>
                removeAlloc({ jobId: alloc.jobId, allocationId: alloc.id })
              }
            />
          ))}
        </div>
      )}

      <div className={styles.allocForm}>
        <div className={styles.allocFormRow}>
          <div className={styles.fieldCol}>
            <label className={styles.fieldLabel} htmlFor={`job-${line.id}`}>
              Job
            </label>
            <select
              id={`job-${line.id}`}
              value={jobId}
              onChange={(e) => {
                setJobId(e.target.value);
                setQty("");
                setError(null);
              }}
              className={styles.select}
            >
              <option value="">Select job...</option>
              {availableJobs.map((j) => (
                <option key={j.id} value={j.id}>
                  {j.jobNumber} — {j.productType} ({j.available} avail)
                </option>
              ))}
            </select>
          </div>
          <div className={styles.fieldCol}>
            <label className={styles.fieldLabel} htmlFor={`qty-${line.id}`}>
              Qty{" "}
              {effectiveMax > 0 && (
                <span className={styles.optional}>(max {effectiveMax})</span>
              )}
            </label>
            <input
              id={`qty-${line.id}`}
              type="number"
              min={1}
              max={effectiveMax}
              value={qty}
              onChange={(e) => setQty(e.target.value)}
              className={styles.inputNum}
              placeholder="0"
              disabled={!selectedJob}
            />
          </div>
          <button
            type="button"
            onClick={handleAdd}
            disabled={adding || !selectedJob}
            className={styles.allocateBtn}
          >
            {adding ? "Adding..." : "Allocate"}
          </button>
        </div>
        {error && <p className={styles.formError}>{error}</p>}
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

  if (isLoading) return <p className={styles.loading}>Loading...</p>;
  if (error) return <p className={styles.error}>Error: {error.message}</p>;
  if (!order) return null;

  return (
    <div className={styles.root}>
      <div className={styles.header}>
        <button type="button" onClick={onBack} className={styles.backBtn}>
          <ChevronLeft size={16} strokeWidth={2} aria-hidden />
          Back
        </button>
        <h3 className={styles.title}>
          {order.orderNumber} — {order.customerName}
        </h3>
      </div>

      <div className={styles.kpiGrid}>
        <div className={styles.kpiCard}>
          <p className={styles.kpiLabel}>Status</p>
          <div className={styles.kpiStatusSlot}>
            <CustomerOrderStatusBadge status={order.status} />
          </div>
        </div>
        <div className={styles.kpiCard}>
          <p className={styles.kpiLabel}>Allocated</p>
          <p className={styles.kpiValue}>{order.allocationPct}%</p>
        </div>
        <div className={styles.kpiCard}>
          <p className={styles.kpiLabel}>Fulfilled</p>
          <p className={styles.kpiValue}>{order.fulfillmentPct}%</p>
        </div>
        <div className={styles.kpiCard}>
          <p className={styles.kpiLabel}>Lines</p>
          <p className={styles.kpiValue}>{order.lines.length}</p>
        </div>
        <div className={styles.kpiCard}>
          <p className={styles.kpiLabel}>Due</p>
          <p className={styles.kpiValue}>{order.dueDate ?? "—"}</p>
        </div>
      </div>

      <div className={styles.section}>
        <h4 className={styles.sectionTitle}>Order Summary</h4>
        <table className={styles.table}>
          <thead>
            <tr className={styles.thRow}>
              <th className={styles.th}>Product Type</th>
              <th className={`${styles.th} ${styles.thRight}`}>Requested</th>
              <th className={`${styles.th} ${styles.thRight}`}>Allocated</th>
              <th className={`${styles.th} ${styles.thRight}`}>Fulfilled</th>
              <th className={`${styles.th} ${styles.thRight}`}>Progress</th>
            </tr>
          </thead>
          <tbody>
            {order.lines.map((line) => {
              const pct =
                line.quantity > 0
                  ? Math.round(
                      (Math.min(line.fulfilledQuantity, line.quantity) /
                        line.quantity) *
                        100,
                    )
                  : 0;
              return (
                <tr key={line.id} className={styles.tr}>
                  <td className={`${styles.td} ${styles.tdStrong}`}>
                    {line.productType}
                  </td>
                  <td className={`${styles.td} ${styles.tdRight}`}>{line.quantity}</td>
                  <td className={`${styles.td} ${styles.tdRight}`}>
                    {line.allocatedQuantity}
                  </td>
                  <td className={`${styles.td} ${styles.tdRight}`}>
                    {line.fulfilledQuantity}
                  </td>
                  <td className={`${styles.td} ${styles.progressCell}`}>
                    <div className={styles.progressWrap}>
                      <div className={styles.barTrack}>
                        <div
                          className={styles.barFill}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <span className={styles.pct}>{pct}%</span>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div>
        <h4 className={styles.linesHeading}>Line Items &amp; Job Allocations</h4>
        <div className={styles.linesStack}>
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
        <div className={styles.section}>
          <h4 className={styles.sectionTitle}>Notes</h4>
          <p className={styles.notesText}>{order.notes}</p>
        </div>
      )}
    </div>
  );
}
