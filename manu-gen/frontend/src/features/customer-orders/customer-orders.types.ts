export type CustomerOrderStatus = "open" | "in_progress" | "fulfilled" | "cancelled";

export interface LineAllocation {
  id: number;
  jobId: number;
  jobNumber: string;
  quantity: number;
}

export interface OrderLine {
  id: number;
  productType: string;
  quantity: number;
  allocatedQuantity: number;
  fulfilledQuantity: number;
  allocations: LineAllocation[];
}

export interface CustomerOrder {
  id: number;
  orderNumber: string;
  customerName: string;
  notes: string;
  status: CustomerOrderStatus;
  dueDate: string | null;
  createdAt: string;
  lines: OrderLine[];
  allocationPct: number;
  fulfillmentPct: number;
}

export interface CustomerOrderSummary {
  id: number;
  orderNumber: string;
  customerName: string;
  status: CustomerOrderStatus;
  dueDate: string | null;
  createdAt: string;
  lineCount: number;
  allocationPct: number;
  fulfillmentPct: number;
}
