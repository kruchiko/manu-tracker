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
    productType: "Widget",
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

  it("should cascade-delete allocations when order is deleted", () => {
    const order = service.createCustomerOrder({
      customerName: "Acme",
      lines: [{ productType: "Widget", quantity: 10 }],
    });
    const job = jobsService.createJob({ productType: "Widget", quantity: 20, pipelineId });
    jobsService.addAllocation(job.id, { orderLineId: order.lines[0].id, quantity: 5 });

    service.deleteCustomerOrder(order.id);

    expect(() => service.getCustomerOrderById(order.id)).toThrow(
      expect.objectContaining({ statusCode: 404 }),
    );
    expect(jobsService.listAllocations(job.id)).toHaveLength(0);
  });

  it("should throw 404 when order does not exist", () => {
    expect(() => service.deleteCustomerOrder(999)).toThrow(
      expect.objectContaining({ statusCode: 404 }),
    );
  });

  it("should reduce shared job quantity when order is deleted", () => {
    const job = jobsService.createJob({ productType: "Widget", quantity: 20, pipelineId });

    const order1 = service.createCustomerOrder({
      customerName: "A",
      lines: [{ productType: "Widget", quantity: 5 }],
    });
    jobsService.addAllocation(job.id, { orderLineId: order1.lines[0].id, quantity: 5 });

    const order2 = service.createCustomerOrder({
      customerName: "B",
      lines: [{ productType: "Widget", quantity: 3 }],
    });
    jobsService.addAllocation(job.id, { orderLineId: order2.lines[0].id, quantity: 3 });

    service.deleteCustomerOrder(order1.id);

    const updated = jobsService.getJobById(job.id);
    expect(updated.quantity).toBe(15);
    expect(jobsService.listAllocations(job.id)).toHaveLength(1);
  });

  it("should delete exclusively-serving jobs when order is deleted", () => {
    // Need a pipeline with capacity for auto-allocation to create jobs
    const capPipeline = pipelinesService.createPipeline({
      name: "Cap Pipeline",
      productType: "Cap",
      steps: [{ stationId, maxDurationSeconds: 60, maxCapacity: 10 }],
    });

    const order = service.createCustomerOrder({
      customerName: "Solo",
      lines: [{ productType: "Cap", quantity: 15 }],
    });
    const autoJobIds = order.lines[0].allocations.map((a) => a.jobId);
    expect(autoJobIds.length).toBe(2);

    service.deleteCustomerOrder(order.id);

    for (const jobId of autoJobIds) {
      expect(() => jobsService.getJobById(jobId)).toThrow(
        expect.objectContaining({ statusCode: 404 }),
      );
    }
  });
});

describe("auto-allocation on order creation", () => {
  let capacityPipelineId: string;

  beforeEach(() => {
    // Create a pipeline with capacity configured
    capacityPipelineId = pipelinesService.createPipeline({
      name: "Capacity Pipeline",
      productType: "Crone",
      steps: [{ stationId, maxDurationSeconds: 120, maxCapacity: 10 }],
    }).id;
  });

  it("should auto-create jobs and allocate when pipeline has capacity", () => {
    const order = service.createCustomerOrder({
      customerName: "Acme",
      lines: [{ productType: "Crone", quantity: 8 }],
    });

    expect(order.lines[0].allocatedQuantity).toBe(8);
    expect(order.lines[0].allocations).toHaveLength(1);
    expect(order.allocationPct).toBe(100);
  });

  it("should create multiple jobs when quantity exceeds capacity", () => {
    const order = service.createCustomerOrder({
      customerName: "Acme",
      lines: [{ productType: "Crone", quantity: 25 }],
    });

    expect(order.lines[0].allocatedQuantity).toBe(25);
    expect(order.lines[0].allocations).toHaveLength(3); // 10 + 10 + 5
    expect(order.lines[0].allocations[0].quantity).toBe(10);
    expect(order.lines[0].allocations[1].quantity).toBe(10);
    expect(order.lines[0].allocations[2].quantity).toBe(5);
    expect(order.allocationPct).toBe(100);
  });

  it("should pack into existing pending jobs before creating new ones", () => {
    // Create a pending job with quantity 3, no allocations → capacity(10) - allocated(0) = 10 free
    jobsService.createJob({ productType: "Crone", quantity: 3, pipelineId: capacityPipelineId });

    const order = service.createCustomerOrder({
      customerName: "Acme",
      lines: [{ productType: "Crone", quantity: 15 }],
    });

    // 10 packed into existing job (grown from 3→10), then 5 in a new job
    expect(order.lines[0].allocatedQuantity).toBe(15);
    expect(order.lines[0].allocations).toHaveLength(2);
    expect(order.lines[0].allocations[0].quantity).toBe(10);
    expect(order.lines[0].allocations[1].quantity).toBe(5);
  });

  it("should not allocate when no pipeline matches the product type", () => {
    const order = service.createCustomerOrder({
      customerName: "Acme",
      lines: [{ productType: "Unknown", quantity: 10 }],
    });

    expect(order.lines[0].allocatedQuantity).toBe(0);
    expect(order.lines[0].allocations).toEqual([]);
  });

  it("should not pack into in_progress jobs", () => {
    const job = jobsService.createJob({ productType: "Crone", quantity: 3, pipelineId: capacityPipelineId });
    // Simulate starting the job by directly updating status
    db.prepare("UPDATE jobs SET status = 'in_progress' WHERE id = ?").run(job.id);

    const order = service.createCustomerOrder({
      customerName: "Acme",
      lines: [{ productType: "Crone", quantity: 5 }],
    });

    // Should create a new job, not pack into the in_progress one
    expect(order.lines[0].allocatedQuantity).toBe(5);
    expect(order.lines[0].allocations).toHaveLength(1);
    // The allocation should NOT be on the in_progress job
    expect(order.lines[0].allocations[0].jobId).not.toBe(job.id);
  });

  it("should handle multiple lines with different product types", () => {
    // Add another pipeline for a different product
    pipelinesService.createPipeline({
      name: "Gadget Pipeline",
      productType: "Gadget",
      steps: [{ stationId, maxDurationSeconds: 60, maxCapacity: 5 }],
    });

    const order = service.createCustomerOrder({
      customerName: "Acme",
      lines: [
        { productType: "Crone", quantity: 8 },
        { productType: "Gadget", quantity: 12 },
      ],
    });

    expect(order.lines[0].allocatedQuantity).toBe(8);
    expect(order.lines[0].allocations).toHaveLength(1);
    expect(order.lines[1].allocatedQuantity).toBe(12);
    expect(order.lines[1].allocations).toHaveLength(3); // 5 + 5 + 2
    expect(order.allocationPct).toBe(100);
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
