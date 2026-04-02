import { describe, it, expect, beforeEach } from "vitest";
import db from "../../db.js";
import * as pipelinesService from "../pipelines/pipelines.service.js";
import * as stationsService from "../stations/stations.service.js";
import * as customerOrdersService from "../customer-orders/customer-orders.service.js";
import * as eventsService from "../events/events.service.js";
import * as jobsService from "./jobs.service.js";

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
  db.exec("DELETE FROM sqlite_sequence WHERE name = 'jobs'");

  stationId = stationsService.createStation({ name: "Test Station" }).id;
  const pipeline = pipelinesService.createPipeline({
    name: "Test Pipeline",
    productType: "Widget",
    steps: [{ stationId, maxDurationSeconds: 120 }],
  });
  pipelineId = pipeline.id;
});

describe("createJob", () => {
  it("should create a job and return it", () => {
    const job = jobsService.createJob({
      productType: "Widget",
      quantity: 10,
      pipelineId,
    });

    expect(job.id).toBe(1);
    expect(job.jobNumber).toBe("JOB-0001");
    expect(job.productType).toBe("Widget");
    expect(job.quantity).toBe(10);
    expect(job.trayCode).toBe("TRAY-0001");
    expect(job.pipelineId).toBe(pipelineId);
    expect(job.pipelineName).toBe("Test Pipeline");
    expect(job.createdAt).toBeTruthy();
  });

  it("should auto-increment job numbers", () => {
    const j1 = jobsService.createJob({ productType: "Widget", quantity: 1, pipelineId });
    const j2 = jobsService.createJob({ productType: "Widget", quantity: 2, pipelineId });

    expect(j1.jobNumber).toBe("JOB-0001");
    expect(j2.jobNumber).toBe("JOB-0002");
  });

  it("should set notes to empty string by default", () => {
    const job = jobsService.createJob({ productType: "Widget", quantity: 1, pipelineId });
    expect(job.notes).toBe("");
  });
});

describe("getJobById", () => {
  it("should return a job when it exists", () => {
    const created = jobsService.createJob({ productType: "Widget", quantity: 5, pipelineId });
    const found = jobsService.getJobById(created.id);

    expect(found.id).toBe(created.id);
    expect(found.productType).toBe("Widget");
  });

  it("should throw 404 when job does not exist", () => {
    expect(() => jobsService.getJobById(999)).toThrow(
      expect.objectContaining({ statusCode: 404 }),
    );
  });
});

describe("getJobByTrayCode", () => {
  it("should return a job by tray code", () => {
    const created = jobsService.createJob({ productType: "Widget", quantity: 5, pipelineId });
    const found = jobsService.getJobByTrayCode(created.trayCode);

    expect(found.id).toBe(created.id);
  });

  it("should throw 404 for unknown tray code", () => {
    expect(() => jobsService.getJobByTrayCode("TRAY-NOPE")).toThrow(
      expect.objectContaining({ statusCode: 404 }),
    );
  });
});

describe("listJobs", () => {
  it("should return jobs in descending order", () => {
    jobsService.createJob({ productType: "Widget", quantity: 1, pipelineId });
    jobsService.createJob({ productType: "Widget", quantity: 2, pipelineId });

    const jobs = jobsService.listJobs();

    expect(jobs).toHaveLength(2);
    expect(jobs[0].jobNumber).toBe("JOB-0002");
    expect(jobs[1].jobNumber).toBe("JOB-0001");
  });

  it("should respect limit and offset", () => {
    jobsService.createJob({ productType: "Widget", quantity: 1, pipelineId });
    jobsService.createJob({ productType: "Widget", quantity: 2, pipelineId });
    jobsService.createJob({ productType: "Widget", quantity: 3, pipelineId });

    const page = jobsService.listJobs({ limit: 1, offset: 1 });

    expect(page).toHaveLength(1);
    expect(page[0].jobNumber).toBe("JOB-0002");
  });
});

describe("getJobBoard", () => {
  it("should return all jobs", () => {
    jobsService.createJob({ productType: "Widget", quantity: 5, pipelineId });
    const board = jobsService.getJobBoard();

    expect(board).toHaveLength(1);
    expect(board[0].jobNumber).toBe("JOB-0001");
    expect(board[0].pipeline.id).toBe(pipelineId);
  });
});

describe("buildJobHistoryEntries", () => {
  it("should compute duration from arrived to departed", () => {
    const entries = jobsService.buildJobHistoryEntries([
      { id: 1, station_id: "s1", station_name: "Moulding", captured_at: "2026-01-01 10:00:00", phase: "arrived" },
      { id: 2, station_id: "s1", station_name: "Moulding", captured_at: "2026-01-01 10:05:00", phase: "departed" },
    ]);

    expect(entries).toHaveLength(2);
    expect(entries[0].phase).toBe("arrived");
    expect(entries[0].durationSeconds).toBeNull();
    expect(entries[1].phase).toBe("departed");
    expect(entries[1].durationSeconds).toBe(300);
  });

  it("should handle scan-only events", () => {
    const entries = jobsService.buildJobHistoryEntries([
      { id: 1, station_id: "s1", station_name: "A", captured_at: "2026-01-01 10:00:00", phase: "scan" },
      { id: 2, station_id: "s2", station_name: "B", captured_at: "2026-01-01 10:10:00", phase: "scan" },
    ]);

    expect(entries).toHaveLength(2);
    expect(entries[0].durationSeconds).toBe(600);
    expect(entries[1].durationSeconds).toBeNull();
  });
});

describe("generateQrCode", () => {
  it("should return a PNG buffer", async () => {
    const job = jobsService.createJob({ productType: "Widget", quantity: 1, pipelineId });
    const buffer = await jobsService.generateQrCode(job.id);

    expect(Buffer.isBuffer(buffer)).toBe(true);
    expect(buffer.length).toBeGreaterThan(0);
  });

  it("should throw 404 for non-existent job", async () => {
    await expect(jobsService.generateQrCode(999)).rejects.toThrow(
      expect.objectContaining({ statusCode: 404 }),
    );
  });
});

describe("allocations", () => {
  function createOrderWithLine() {
    const order = customerOrdersService.createCustomerOrder({
      customerName: "Acme",
      lines: [{ productType: "Widget", quantity: 10 }],
    });
    return { orderId: order.id, lineId: order.lines[0].id };
  }

  describe("addAllocation", () => {
    it("should allocate a quantity from a job to an order line", () => {
      const { lineId } = createOrderWithLine();
      const job = jobsService.createJob({ productType: "Widget", quantity: 20, pipelineId });

      const alloc = jobsService.addAllocation(job.id, { orderLineId: lineId, quantity: 5 });

      expect(alloc.id).toBeGreaterThan(0);
      expect(alloc.jobId).toBe(job.id);
      expect(alloc.orderLineId).toBe(lineId);
      expect(alloc.quantity).toBe(5);
      expect(alloc.customerName).toBe("Acme");
    });

    it("should reject duplicate allocation for same job + order line", () => {
      const { lineId } = createOrderWithLine();
      const job = jobsService.createJob({ productType: "Widget", quantity: 20, pipelineId });

      jobsService.addAllocation(job.id, { orderLineId: lineId, quantity: 5 });

      expect(() =>
        jobsService.addAllocation(job.id, { orderLineId: lineId, quantity: 3 }),
      ).toThrow(expect.objectContaining({ statusCode: 409 }));
    });

    it("should throw 404 for non-existent job", () => {
      const { lineId } = createOrderWithLine();

      expect(() =>
        jobsService.addAllocation(999, { orderLineId: lineId, quantity: 1 }),
      ).toThrow(expect.objectContaining({ statusCode: 404 }));
    });

    it("should throw 404 for non-existent order line", () => {
      const job = jobsService.createJob({ productType: "Widget", quantity: 20, pipelineId });

      expect(() =>
        jobsService.addAllocation(job.id, { orderLineId: 999, quantity: 1 }),
      ).toThrow(expect.objectContaining({ statusCode: 404 }));
    });

    it("should throw 422 when allocation exceeds job capacity", () => {
      const { lineId } = createOrderWithLine();
      const job = jobsService.createJob({ productType: "Widget", quantity: 5, pipelineId });

      expect(() =>
        jobsService.addAllocation(job.id, { orderLineId: lineId, quantity: 10 }),
      ).toThrow(expect.objectContaining({ statusCode: 422 }));
    });

    it("should throw 422 when remaining capacity is insufficient", () => {
      const order1 = customerOrdersService.createCustomerOrder({
        customerName: "First",
        lines: [{ productType: "Widget", quantity: 8 }],
      });
      const job = jobsService.createJob({ productType: "Widget", quantity: 10, pipelineId });
      jobsService.addAllocation(job.id, { orderLineId: order1.lines[0].id, quantity: 8 });

      const order2 = customerOrdersService.createCustomerOrder({
        customerName: "Second",
        lines: [{ productType: "Widget", quantity: 5 }],
      });

      expect(() =>
        jobsService.addAllocation(job.id, { orderLineId: order2.lines[0].id, quantity: 5 }),
      ).toThrow(expect.objectContaining({ statusCode: 422 }));
    });

    it("should throw 422 when job product type does not match order line", () => {
      const order = customerOrdersService.createCustomerOrder({
        customerName: "Mismatch",
        lines: [{ productType: "Gadget", quantity: 5 }],
      });
      const job = jobsService.createJob({ productType: "Widget", quantity: 20, pipelineId });

      expect(() =>
        jobsService.addAllocation(job.id, { orderLineId: order.lines[0].id, quantity: 3 }),
      ).toThrow(expect.objectContaining({ statusCode: 422 }));
    });
  });

  describe("listAllocations", () => {
    it("should return allocations for a job", () => {
      const { lineId } = createOrderWithLine();
      const job = jobsService.createJob({ productType: "Widget", quantity: 20, pipelineId });
      jobsService.addAllocation(job.id, { orderLineId: lineId, quantity: 5 });

      const allocs = jobsService.listAllocations(job.id);

      expect(allocs).toHaveLength(1);
      expect(allocs[0].orderLineId).toBe(lineId);
    });

    it("should return empty array when no allocations", () => {
      const job = jobsService.createJob({ productType: "Widget", quantity: 5, pipelineId });
      expect(jobsService.listAllocations(job.id)).toEqual([]);
    });
  });

  describe("removeAllocation", () => {
    it("should remove an allocation", () => {
      const { lineId } = createOrderWithLine();
      const job = jobsService.createJob({ productType: "Widget", quantity: 20, pipelineId });
      const alloc = jobsService.addAllocation(job.id, { orderLineId: lineId, quantity: 5 });

      jobsService.removeAllocation(job.id, alloc.id);

      expect(jobsService.listAllocations(job.id)).toEqual([]);
    });

    it("should throw 404 for non-existent allocation", () => {
      const job = jobsService.createJob({ productType: "Widget", quantity: 20, pipelineId });

      expect(() => jobsService.removeAllocation(job.id, 999)).toThrow(
        expect.objectContaining({ statusCode: 404 }),
      );
    });
  });
});

describe("onTrackingEvent (status transitions)", () => {
  it("should transition pending job to in_progress on first event", () => {
    const job = jobsService.createJob({ productType: "Widget", quantity: 10, pipelineId });
    expect(jobsService.getJobById(job.id).status).toBe("pending");

    eventsService.createEvent({
      trayCode: job.trayCode,
      stationId,
      eyeId: "eye-1",
      capturedAt: new Date().toISOString(),
      phase: "arrived",
    });

    expect(jobsService.getJobById(job.id).status).toBe("in_progress");
  });

  it("should transition in_progress to completed when all steps departed", () => {
    const job = jobsService.createJob({ productType: "Widget", quantity: 10, pipelineId });

    eventsService.createEvent({
      trayCode: job.trayCode,
      stationId,
      eyeId: "eye-1",
      capturedAt: new Date().toISOString(),
      phase: "arrived",
    });
    expect(jobsService.getJobById(job.id).status).toBe("in_progress");

    eventsService.createEvent({
      trayCode: job.trayCode,
      stationId,
      eyeId: "eye-1",
      capturedAt: new Date().toISOString(),
      phase: "departed",
    });
    expect(jobsService.getJobById(job.id).status).toBe("completed");
  });

  it("should not change status for unknown tray codes", () => {
    jobsService.createJob({ productType: "Widget", quantity: 10, pipelineId });

    eventsService.createEvent({
      trayCode: "UNKNOWN-TRAY",
      stationId,
      eyeId: "eye-1",
      capturedAt: new Date().toISOString(),
      phase: "arrived",
    });

    const job = jobsService.getJobById(1);
    expect(job.status).toBe("pending");
  });

  it("should not change completed status on further events", () => {
    const job = jobsService.createJob({ productType: "Widget", quantity: 10, pipelineId });

    eventsService.createEvent({
      trayCode: job.trayCode,
      stationId,
      eyeId: "eye-1",
      capturedAt: new Date().toISOString(),
      phase: "arrived",
    });
    eventsService.createEvent({
      trayCode: job.trayCode,
      stationId,
      eyeId: "eye-1",
      capturedAt: new Date().toISOString(),
      phase: "departed",
    });
    expect(jobsService.getJobById(job.id).status).toBe("completed");

    eventsService.createEvent({
      trayCode: job.trayCode,
      stationId,
      eyeId: "eye-1",
      capturedAt: new Date().toISOString(),
      phase: "arrived",
    });
    expect(jobsService.getJobById(job.id).status).toBe("completed");
  });
});

describe("deleteJob", () => {
  it("should delete a job with no allocations or events", () => {
    const job = jobsService.createJob({ productType: "Widget", quantity: 5, pipelineId });
    jobsService.deleteJob(job.id);

    expect(() => jobsService.getJobById(job.id)).toThrow(
      expect.objectContaining({ statusCode: 404 }),
    );
  });

  it("should cascade-delete allocations and tracking events", () => {
    const job = jobsService.createJob({ productType: "Widget", quantity: 10, pipelineId });

    const order = customerOrdersService.createCustomerOrder({
      customerName: "Test",
      lines: [{ productType: "Widget", quantity: 5 }],
    });
    jobsService.addAllocation(job.id, { orderLineId: order.lines[0].id, quantity: 3 });

    eventsService.createEvent({
      trayCode: job.trayCode,
      stationId,
      eyeId: "eye-1",
      capturedAt: new Date().toISOString(),
      phase: "arrived",
    });

    jobsService.deleteJob(job.id);

    expect(() => jobsService.getJobById(job.id)).toThrow(
      expect.objectContaining({ statusCode: 404 }),
    );
    const { cnt } = db.prepare("SELECT COUNT(*) AS cnt FROM tracking_events WHERE tray_code = ?").get(job.trayCode) as { cnt: number };
    expect(cnt).toBe(0);
  });

  it("should throw 404 for non-existent job", () => {
    expect(() => jobsService.deleteJob(999)).toThrow(
      expect.objectContaining({ statusCode: 404 }),
    );
  });
});

describe("createJob validations", () => {
  it("should throw 422 when quantity exceeds pipeline capacity", () => {
    const capacityPipeline = pipelinesService.createPipeline({
      name: "Capped",
      productType: "Capped",
      steps: [{ stationId, maxDurationSeconds: 60, maxCapacity: 10 }],
    });

    expect(() =>
      jobsService.createJob({ productType: "Capped", quantity: 15, pipelineId: capacityPipeline.id }),
    ).toThrow(expect.objectContaining({ statusCode: 422 }));
  });

  it("should allow quantity at exactly pipeline capacity", () => {
    const capacityPipeline = pipelinesService.createPipeline({
      name: "Exact",
      productType: "Exact",
      steps: [{ stationId, maxDurationSeconds: 60, maxCapacity: 10 }],
    });

    const job = jobsService.createJob({ productType: "Exact", quantity: 10, pipelineId: capacityPipeline.id });
    expect(job.quantity).toBe(10);
  });

  it("should throw 422 when product type does not match pipeline", () => {
    expect(() =>
      jobsService.createJob({ productType: "Wrong", quantity: 1, pipelineId }),
    ).toThrow(expect.objectContaining({ statusCode: 422 }));
  });
});
