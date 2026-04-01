import db from "../../db.js";
import { AppError } from "../../shared/errors/app-error.js";
import type {
  CreateCustomerOrderInput,
  UpdateCustomerOrderInput,
  CustomerOrderRow,
  OrderLineRow,
  OrderLine,
  LineAllocation,
  CustomerOrder,
  CustomerOrderSummary,
  CustomerOrderStatus,
} from "./customer-orders.schema.js";
import { toCustomerOrderSummary } from "./customer-orders.schema.js";
import { stmtInsertAllocation } from "../../shared/allocation-statements.js";

function formatOrderNumber(id: number): string {
  return `CO-${String(id).padStart(4, "0")}`;
}

const stmtNextId = db.prepare(
  "SELECT COALESCE(MAX(id), 0) + 1 AS next_id FROM customer_orders",
);

const stmtInsertOrder = db.prepare(`
  INSERT INTO customer_orders (id, order_number, customer_name, notes, due_date)
  VALUES (@id, @order_number, @customer_name, @notes, @due_date)
`);

const stmtInsertLine = db.prepare(`
  INSERT INTO order_lines (customer_order_id, product_type, quantity)
  VALUES (@customer_order_id, @product_type, @quantity)
`);

const stmtGetById = db.prepare(
  `SELECT id, order_number, customer_name, notes, status, due_date, created_at
   FROM customer_orders WHERE id = ?`,
);

const stmtList = db.prepare(
  `SELECT id, order_number, customer_name, notes, status, due_date, created_at
   FROM customer_orders ORDER BY id DESC LIMIT ? OFFSET ?`,
);

const stmtLinesByOrder = db.prepare(
  `SELECT id, customer_order_id, product_type, quantity
   FROM order_lines WHERE customer_order_id = ? ORDER BY id`,
);

const stmtUpdate = db.prepare(`
  UPDATE customer_orders
  SET customer_name = COALESCE(@customer_name, customer_name),
      notes         = COALESCE(@notes, notes),
      status        = COALESCE(@status, status),
      due_date      = CASE WHEN @has_due_date THEN @due_date ELSE due_date END
  WHERE id = @id
`);

const stmtDelete = db.prepare(`DELETE FROM customer_orders WHERE id = ?`);
const stmtDeleteLines = db.prepare(`DELETE FROM order_lines WHERE customer_order_id = ?`);

const stmtAllocCountByLine = db.prepare(`
  SELECT COALESCE(SUM(quantity), 0) AS total
  FROM job_allocations WHERE order_line_id = ?
`);

const stmtFulfilledCountByLine = db.prepare(`
  SELECT COALESCE(SUM(ja.quantity), 0) AS total
  FROM job_allocations ja
  JOIN jobs j ON j.id = ja.job_id
  WHERE ja.order_line_id = ?
    AND (
      SELECT COUNT(DISTINCT te.station_id)
      FROM tracking_events te
      WHERE te.tray_code = j.tray_code AND te.phase = 'departed'
    ) >= (
      SELECT COUNT(*) FROM pipeline_steps ps WHERE ps.pipeline_id = j.pipeline_id
    )
    AND (SELECT COUNT(*) FROM pipeline_steps ps2 WHERE ps2.pipeline_id = j.pipeline_id) > 0
`);

const stmtAllocsByLine = db.prepare(`
  SELECT ja.id, ja.job_id, j.job_number, ja.quantity
  FROM job_allocations ja
  JOIN jobs j ON j.id = ja.job_id
  WHERE ja.order_line_id = ?
  ORDER BY ja.id
`);

const stmtAvailableJobs = db.prepare(`
  SELECT j.id, j.quantity - COALESCE(SUM(ja.quantity), 0) AS available
  FROM jobs j
  LEFT JOIN job_allocations ja ON ja.job_id = j.id
  WHERE j.product_type = ?
  GROUP BY j.id
  HAVING available > 0
  ORDER BY j.id ASC
`);

const stmtAllocCountByOrder = db.prepare(`
  SELECT COUNT(*) AS cnt FROM job_allocations ja
  JOIN order_lines ol ON ol.id = ja.order_line_id
  WHERE ol.customer_order_id = ?
`);

interface AllocRow {
  id: number;
  job_id: number;
  job_number: string;
  quantity: number;
}

function buildOrderLine(row: OrderLineRow): OrderLine {
  const { total: allocatedQuantity } = stmtAllocCountByLine.get(row.id) as { total: number };
  const { total: fulfilledQuantity } = stmtFulfilledCountByLine.get(row.id) as { total: number };
  const allocRows = stmtAllocsByLine.all(row.id) as AllocRow[];
  const allocations: LineAllocation[] = allocRows.map((a) => ({
    id: a.id,
    jobId: a.job_id,
    jobNumber: a.job_number,
    quantity: a.quantity,
  }));
  return {
    id: row.id,
    productType: row.product_type,
    quantity: row.quantity,
    allocatedQuantity,
    fulfilledQuantity,
    allocations,
  };
}

function computePcts(lines: OrderLine[]): { allocationPct: number; fulfillmentPct: number } {
  if (lines.length === 0) return { allocationPct: 0, fulfillmentPct: 0 };
  const totalRequested = lines.reduce((sum, l) => sum + l.quantity, 0);
  if (totalRequested === 0) return { allocationPct: 100, fulfillmentPct: 100 };
  const totalAllocated = lines.reduce((sum, l) => sum + Math.min(l.allocatedQuantity, l.quantity), 0);
  const totalFulfilled = lines.reduce((sum, l) => sum + Math.min(l.fulfilledQuantity, l.quantity), 0);
  return {
    allocationPct: Math.round((totalAllocated / totalRequested) * 100),
    fulfillmentPct: Math.round((totalFulfilled / totalRequested) * 100),
  };
}

interface AvailableJobRow {
  id: number;
  available: number;
}

function autoAllocateLine(orderLineId: number, productType: string, quantityNeeded: number): void {
  const jobs = stmtAvailableJobs.all(productType) as AvailableJobRow[];
  let remaining = quantityNeeded;

  for (const job of jobs) {
    if (remaining <= 0) break;
    const toAllocate = Math.min(job.available, remaining);
    stmtInsertAllocation.run({
      order_line_id: orderLineId,
      job_id: job.id,
      quantity: toAllocate,
    });
    remaining -= toAllocate;
  }
}

const createOrderTx = db.transaction((input: CreateCustomerOrderInput): number => {
  const { next_id: nextId } = stmtNextId.get() as { next_id: number };

  stmtInsertOrder.run({
    id: nextId,
    order_number: formatOrderNumber(nextId),
    customer_name: input.customerName,
    notes: input.notes ?? "",
    due_date: input.dueDate ?? null,
  });

  for (const line of input.lines) {
    const result = stmtInsertLine.run({
      customer_order_id: nextId,
      product_type: line.productType,
      quantity: line.quantity,
    });
    autoAllocateLine(
      Number(result.lastInsertRowid),
      line.productType,
      line.quantity,
    );
  }

  return nextId;
});

export function createCustomerOrder(input: CreateCustomerOrderInput): CustomerOrder {
  const id = createOrderTx(input);
  return getCustomerOrderById(id);
}

export function getCustomerOrderById(id: number): CustomerOrder {
  const row = stmtGetById.get(id) as CustomerOrderRow | undefined;
  if (!row) {
    throw new AppError(404, `Customer order with id ${id} not found`);
  }
  const lineRows = stmtLinesByOrder.all(id) as OrderLineRow[];
  const lines = lineRows.map(buildOrderLine);
  return {
    id: row.id,
    orderNumber: row.order_number,
    customerName: row.customer_name,
    notes: row.notes,
    status: row.status as CustomerOrderStatus,
    dueDate: row.due_date,
    createdAt: row.created_at,
    lines,
    ...computePcts(lines),
  };
}

export function listCustomerOrders({
  limit = 50,
  offset = 0,
}: { limit?: number; offset?: number } = {}): CustomerOrderSummary[] {
  const rows = stmtList.all(limit, offset) as CustomerOrderRow[];
  return rows.map((row) => {
    const lineRows = stmtLinesByOrder.all(row.id) as OrderLineRow[];
    const lines = lineRows.map(buildOrderLine);
    return toCustomerOrderSummary(row, lines.length, computePcts(lines));
  });
}

export function updateCustomerOrder(
  id: number,
  input: UpdateCustomerOrderInput,
): CustomerOrder {
  const existing = stmtGetById.get(id) as CustomerOrderRow | undefined;
  if (!existing) {
    throw new AppError(404, `Customer order with id ${id} not found`);
  }
  stmtUpdate.run({
    id,
    customer_name: input.customerName ?? null,
    notes: input.notes ?? null,
    status: input.status ?? null,
    has_due_date: input.dueDate !== undefined ? 1 : 0,
    due_date: input.dueDate !== undefined ? input.dueDate : null,
  });
  return getCustomerOrderById(id);
}

const deleteOrderTx = db.transaction((id: number): void => {
  const existing = stmtGetById.get(id) as CustomerOrderRow | undefined;
  if (!existing) {
    throw new AppError(404, `Customer order with id ${id} not found`);
  }
  const { cnt } = stmtAllocCountByOrder.get(id) as { cnt: number };
  if (cnt > 0) {
    throw new AppError(
      409,
      `Cannot delete order "${existing.order_number}": ${cnt} job allocation(s) exist`,
    );
  }
  stmtDeleteLines.run(id);
  stmtDelete.run(id);
});

export function deleteCustomerOrder(id: number): void {
  deleteOrderTx(id);
}
