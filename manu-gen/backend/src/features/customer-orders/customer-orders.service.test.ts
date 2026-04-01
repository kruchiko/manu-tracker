import { describe, it, expect, beforeEach } from "vitest";
import db from "../../db.js";
import * as pipelinesService from "../pipelines/pipelines.service.js";
import * as stationsService from "../stations/stations.service.js";
import * as jobsService from "../jobs/jobs.service.js";
import * as service from "./customer-orders.service.js";

let pipelineId: string;
let stationId: string;

beforeEach(() => {
  db.exec("DELETE FROM tracking_events");
  db.exec("DELETE FROM job_allocations");
  db.exec("DELETE FROM order_lines");
  db.exec("DELETE FROM customer_orders");
  db.exec("DELETE FROM jobs");
  db.exec("DELETE FROM pipeline_steps");
  db.exec("DELETE FROM pipelines");
  db.exec("DELETE FROM stations");
  db.exec("DELETE FROM sqlite_sequence WHERE name = 'customer_orders'");
  db.exec("DELETE FROM sqlite_sequence WHERE name = 'order_lines'");

  stationId = stationsService.createStation({ name: "Test Station" }).id;
  pipelineId = pipelinesService.createPipeline({
    name: "Pipeline A",
    steps: [{ stationId, maxDurationSeconds: 120 }],
  }).id;
});

describe("createCustomerOrder", () => {
  it("should create an order with lines and return it", () => {
    const order = service.createCustomerOrder({
      customerName: "Acme Corp",
      lines: [
        { productType: "Widget", quantity: 10 },
        { productType: "Gadget", quantity: 5 },
      ],
    });

    expect(order.id).toBe(1);
    expect(order.orderNumber).toBe("CO-0001");
    expect(order.customerName).toBe("Acme Corp");
    expect(order.status).toBe("open");
    expect(order.lines).toHaveLength(2);
    expect(order.lines[0].productType).toBe("Widget");
    expect(order.lines[0].quantity).toBe(10);
    expect(order.lines[0].allocatedQuantity).toBe(0);
    expect(order.lines[0].fulfilledQuantity).toBe(0);
    expect(order.lines[0].allocations).toEqual([]);
    expect(order.allocationPct).toBe(0);
    expect(order.fulfillmentPct).toBe(0);
  });

  it("should default notes to empty string", () => {
    const order = service.createCustomerOrder({
      customerName: "Acme",
      lines: [{ productType: "Widget", quantity: 1 }],
    });
    expect(order.notes).toBe("");
  });

  it("should default dueDate to null", () => {
    const order = service.createCustomerOrder({
      customerName: "Acme",
      lines: [{ productType: "Widget", quantity: 1 }],
    });
    expect(order.dueDate).toBeNull();
  });

  it("should store dueDate when provided", () => {
    const order = service.createCustomerOrder({
      customerName: "Acme",
      dueDate: "2026-06-15",
      lines: [{ productType: "Widget", quantity: 1 }],
    });
    expect(order.dueDate).toBe("2026-06-15");
  });
});

describe("getCustomerOrderById", () => {
  it("should return the order when it exists", () => {
    const created = service.createCustomerOrder({
      customerName: "Acme",
      lines: [{ productType: "Widget", quantity: 5 }],
    });
    const found = service.getCustomerOrderById(created.id);

    expect(found.id).toBe(created.id);
    expect(found.customerName).toBe("Acme");
  });

  it("should throw 404 when order does not exist", () => {
    expect(() => service.getCustomerOrderById(999)).toThrow(
      expect.objectContaining({ statusCode: 404 }),
    );
  });
});

describe("listCustomerOrders", () => {
  it("should return orders in descending order", () => {
    service.createCustomerOrder({ customerName: "A", lines: [{ productType: "X", quantity: 1 }] });
    service.createCustomerOrder({ customerName: "B", lines: [{ productType: "Y", quantity: 2 }] });

    const list = service.listCustomerOrders();

    expect(list).toHaveLength(2);
    expect(list[0].customerName).toBe("B");
    expect(list[1].customerName).toBe("A");
  });

  it("should respect limit and offset", () => {
    service.createCustomerOrder({ customerName: "A", lines: [{ productType: "X", quantity: 1 }] });
    service.createCustomerOrder({ customerName: "B", lines: [{ productType: "Y", quantity: 2 }] });
    service.createCustomerOrder({ customerName: "C", lines: [{ productType: "Z", quantity: 3 }] });

    const page = service.listCustomerOrders({ limit: 1, offset: 1 });

    expect(page).toHaveLength(1);
    expect(page[0].customerName).toBe("B");
  });

  it("should return lineCount and percentages in summary", () => {
    service.createCustomerOrder({
      customerName: "Acme",
      lines: [
        { productType: "Widget", quantity: 10 },
        { productType: "Gadget", quantity: 5 },
      ],
    });

    const list = service.listCustomerOrders();

    expect(list[0].lineCount).toBe(2);
    expect(list[0].allocationPct).toBe(0);
    expect(list[0].fulfillmentPct).toBe(0);
  });
});

describe("updateCustomerOrder", () => {
  it("should update customer name", () => {
    const order = service.createCustomerOrder({
      customerName: "Old Name",
      lines: [{ productType: "Widget", quantity: 1 }],
    });

    const updated = service.updateCustomerOrder(order.id, { customerName: "New Name" });

    expect(updated.customerName).toBe("New Name");
  });

  it("should update status", () => {
    const order = service.createCustomerOrder({
      customerName: "Acme",
      lines: [{ productType: "Widget", quantity: 1 }],
    });

    const updated = service.updateCustomerOrder(order.id, { status: "in_progress" });

    expect(updated.status).toBe("in_progress");
  });

  it("should update dueDate to a value", () => {
    const order = service.createCustomerOrder({
      customerName: "Acme",
      lines: [{ productType: "Widget", quantity: 1 }],
    });

    const updated = service.updateCustomerOrder(order.id, { dueDate: "2026-12-31" });

    expect(updated.dueDate).toBe("2026-12-31");
  });

  it("should clear dueDate when set to null", () => {
    const order = service.createCustomerOrder({
      customerName: "Acme",
      dueDate: "2026-06-01",
      lines: [{ productType: "Widget", quantity: 1 }],
    });

    const updated = service.updateCustomerOrder(order.id, { dueDate: null });

    expect(updated.dueDate).toBeNull();
  });

  it("should throw 404 when order does not exist", () => {
    expect(() => service.updateCustomerOrder(999, { notes: "hi" })).toThrow(
      expect.objectContaining({ statusCode: 404 }),
    );
  });
});

describe("deleteCustomerOrder", () => {
  it("should delete an order with no allocations", () => {
    const order = service.createCustomerOrder({
      customerName: "Acme",
      lines: [{ productType: "Widget", quantity: 1 }],
    });

    service.deleteCustomerOrder(order.id);

    expect(() => service.getCustomerOrderById(order.id)).toThrow(
      expect.objectContaining({ statusCode: 404 }),
    );
  });

  it("should throw 409 when order has allocations", () => {
    const order = service.createCustomerOrder({
      customerName: "Acme",
      lines: [{ productType: "Widget", quantity: 10 }],
    });
    const job = jobsService.createJob({ productType: "Widget", quantity: 20, pipelineId });
    jobsService.addAllocation(job.id, { orderLineId: order.lines[0].id, quantity: 5 });

    expect(() => service.deleteCustomerOrder(order.id)).toThrow(
      expect.objectContaining({ statusCode: 409 }),
    );
  });

  it("should throw 404 when order does not exist", () => {
    expect(() => service.deleteCustomerOrder(999)).toThrow(
      expect.objectContaining({ statusCode: 404 }),
    );
  });
});

describe("auto-allocation on order creation", () => {
  it("should auto-allocate matching jobs to order lines", () => {
    jobsService.createJob({ productType: "Widget", quantity: 20, pipelineId });

    const order = service.createCustomerOrder({
      customerName: "Acme",
      lines: [{ productType: "Widget", quantity: 10 }],
    });

    expect(order.lines[0].allocatedQuantity).toBe(10);
    expect(order.lines[0].allocations).toHaveLength(1);
    expect(order.lines[0].allocations[0].jobNumber).toBe("JOB-0001");
    expect(order.lines[0].allocations[0].quantity).toBe(10);
    expect(order.allocationPct).toBe(100);
    expect(order.fulfillmentPct).toBe(0);
  });

  it("should not allocate more than the line needs", () => {
    jobsService.createJob({ productType: "Widget", quantity: 50, pipelineId });

    const order = service.createCustomerOrder({
      customerName: "Acme",
      lines: [{ productType: "Widget", quantity: 5 }],
    });

    expect(order.lines[0].allocatedQuantity).toBe(5);
    expect(order.lines[0].allocations[0].quantity).toBe(5);
  });

  it("should spread across multiple jobs in FIFO order", () => {
    jobsService.createJob({ productType: "Widget", quantity: 6, pipelineId });
    jobsService.createJob({ productType: "Widget", quantity: 10, pipelineId });

    const order = service.createCustomerOrder({
      customerName: "Acme",
      lines: [{ productType: "Widget", quantity: 12 }],
    });

    expect(order.lines[0].allocations).toHaveLength(2);
    expect(order.lines[0].allocations[0].jobNumber).toBe("JOB-0001");
    expect(order.lines[0].allocations[0].quantity).toBe(6);
    expect(order.lines[0].allocations[1].jobNumber).toBe("JOB-0002");
    expect(order.lines[0].allocations[1].quantity).toBe(6);
    expect(order.lines[0].allocatedQuantity).toBe(12);
  });

  it("should partially allocate when job capacity is insufficient", () => {
    jobsService.createJob({ productType: "Widget", quantity: 3, pipelineId });

    const order = service.createCustomerOrder({
      customerName: "Acme",
      lines: [{ productType: "Widget", quantity: 10 }],
    });

    expect(order.lines[0].allocatedQuantity).toBe(3);
    expect(order.lines[0].allocations).toHaveLength(1);
    expect(order.allocationPct).toBe(30);
    expect(order.fulfillmentPct).toBe(0);
  });

  it("should leave allocations empty when no matching jobs exist", () => {
    jobsService.createJob({ productType: "Gadget", quantity: 50, pipelineId });

    const order = service.createCustomerOrder({
      customerName: "Acme",
      lines: [{ productType: "Widget", quantity: 10 }],
    });

    expect(order.lines[0].allocatedQuantity).toBe(0);
    expect(order.lines[0].allocations).toEqual([]);
  });

  it("should respect already-allocated capacity from prior orders", () => {
    jobsService.createJob({ productType: "Widget", quantity: 20, pipelineId });

    service.createCustomerOrder({
      customerName: "First",
      lines: [{ productType: "Widget", quantity: 15 }],
    });

    const second = service.createCustomerOrder({
      customerName: "Second",
      lines: [{ productType: "Widget", quantity: 10 }],
    });

    expect(second.lines[0].allocatedQuantity).toBe(5);
    expect(second.lines[0].allocations[0].quantity).toBe(5);
  });

  it("should auto-allocate each line independently", () => {
    jobsService.createJob({ productType: "Widget", quantity: 10, pipelineId });
    jobsService.createJob({ productType: "Gadget", quantity: 20, pipelineId });

    const order = service.createCustomerOrder({
      customerName: "Acme",
      lines: [
        { productType: "Widget", quantity: 5 },
        { productType: "Gadget", quantity: 8 },
      ],
    });

    expect(order.lines[0].allocatedQuantity).toBe(5);
    expect(order.lines[0].allocations[0].jobNumber).toBe("JOB-0001");
    expect(order.lines[1].allocatedQuantity).toBe(8);
    expect(order.lines[1].allocations[0].jobNumber).toBe("JOB-0002");
    expect(order.allocationPct).toBe(100);
    expect(order.fulfillmentPct).toBe(0);
  });
});

describe("fulfillment tracking", () => {
  it("should include allocation details on order lines", () => {
    const order = service.createCustomerOrder({
      customerName: "Acme",
      lines: [{ productType: "Widget", quantity: 10 }],
    });
    const job = jobsService.createJob({ productType: "Widget", quantity: 20, pipelineId });
    jobsService.addAllocation(job.id, { orderLineId: order.lines[0].id, quantity: 7 });

    const refreshed = service.getCustomerOrderById(order.id);

    expect(refreshed.lines[0].allocations).toHaveLength(1);
    expect(refreshed.lines[0].allocations[0].jobId).toBe(job.id);
    expect(refreshed.lines[0].allocations[0].jobNumber).toBe("JOB-0001");
    expect(refreshed.lines[0].allocations[0].quantity).toBe(7);
  });

  it("should count allocatedQuantity on order lines", () => {
    const order = service.createCustomerOrder({
      customerName: "Acme",
      lines: [{ productType: "Widget", quantity: 10 }],
    });
    const job = jobsService.createJob({ productType: "Widget", quantity: 20, pipelineId });
    jobsService.addAllocation(job.id, { orderLineId: order.lines[0].id, quantity: 7 });

    const refreshed = service.getCustomerOrderById(order.id);

    expect(refreshed.lines[0].allocatedQuantity).toBe(7);
    expect(refreshed.allocationPct).toBe(70);
    expect(refreshed.fulfillmentPct).toBe(0);
  });

  it("should cap fulfillment at 100%", () => {
    const order = service.createCustomerOrder({
      customerName: "Acme",
      lines: [{ productType: "Widget", quantity: 5 }],
    });
    const job = jobsService.createJob({ productType: "Widget", quantity: 20, pipelineId });
    jobsService.addAllocation(job.id, { orderLineId: order.lines[0].id, quantity: 10 });

    const refreshed = service.getCustomerOrderById(order.id);

    expect(refreshed.allocationPct).toBe(100);
    expect(refreshed.fulfillmentPct).toBe(0);
  });

  it("should only count fulfilled from completed jobs", () => {
    const order = service.createCustomerOrder({
      customerName: "Acme",
      lines: [{ productType: "Widget", quantity: 10 }],
    });
    const job = jobsService.createJob({ productType: "Widget", quantity: 20, pipelineId });
    jobsService.addAllocation(job.id, { orderLineId: order.lines[0].id, quantity: 10 });

    const refreshed = service.getCustomerOrderById(order.id);

    expect(refreshed.lines[0].fulfilledQuantity).toBe(0);
  });
});
