import { describe, it, expect, beforeEach } from "vitest";
import request from "supertest";
import { app } from "../../app.js";
import db from "../../db.js";

let pipelineId: string;

beforeEach(async () => {
  db.exec("DELETE FROM tracking_events");
  db.exec("DELETE FROM job_allocations");
  db.exec("DELETE FROM order_lines");
  db.exec("DELETE FROM customer_orders");
  db.exec("DELETE FROM jobs");
  db.exec("DELETE FROM pipeline_steps");
  db.exec("DELETE FROM pipelines");
  db.exec("DELETE FROM stations");
  db.exec("DELETE FROM sqlite_sequence WHERE name = 'jobs'");

  const stationRes = await request(app).post("/stations").send({ name: "Test Station" });
  const pipelineRes = await request(app).post("/pipelines").send({
    name: "Test Pipeline",
    productType: "Widget",
    steps: [{ stationId: stationRes.body.id, maxDurationSeconds: 120 }],
  });
  pipelineId = pipelineRes.body.id;
});

describe("POST /jobs", () => {
  it("should create a job and return 201", async () => {
    const res = await request(app).post("/jobs").send({
      productType: "Widget",
      quantity: 10,
      pipelineId,
    });

    expect(res.status).toBe(201);
    expect(res.body.jobNumber).toBe("JOB-0001");
    expect(res.body.productType).toBe("Widget");
    expect(res.body.quantity).toBe(10);
    expect(res.body.trayCode).toBe("TRAY-0001");
  });

  it("should return 400 when productType is missing", async () => {
    const res = await request(app).post("/jobs").send({
      quantity: 10,
      pipelineId,
    });

    expect(res.status).toBe(400);
    expect(res.body.error).toContain("productType");
  });

  it("should return 400 when quantity is zero", async () => {
    const res = await request(app).post("/jobs").send({
      productType: "Widget",
      quantity: 0,
      pipelineId,
    });

    expect(res.status).toBe(400);
  });

  it("should return 400 when pipelineId is missing", async () => {
    const res = await request(app).post("/jobs").send({
      productType: "Widget",
      quantity: 10,
    });

    expect(res.status).toBe(400);
    expect(res.body.error).toContain("pipelineId");
  });
});

describe("GET /jobs", () => {
  it("should return empty array when no jobs exist", async () => {
    const res = await request(app).get("/jobs");
    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });

  it("should return jobs after creation", async () => {
    await request(app).post("/jobs").send({ productType: "Widget", quantity: 5, pipelineId });
    const res = await request(app).get("/jobs");

    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
    expect(res.body[0].productType).toBe("Widget");
  });

  it("should return 400 when limit exceeds MAX_PAGE_SIZE", async () => {
    const res = await request(app).get("/jobs?limit=101");
    expect(res.status).toBe(400);
  });

  it("should return 400 when offset is negative", async () => {
    const res = await request(app).get("/jobs?offset=-1");
    expect(res.status).toBe(400);
  });
});

describe("GET /jobs/:id", () => {
  it("should return a specific job", async () => {
    const create = await request(app).post("/jobs").send({ productType: "Widget", quantity: 5, pipelineId });
    const res = await request(app).get(`/jobs/${create.body.id}`);

    expect(res.status).toBe(200);
    expect(res.body.productType).toBe("Widget");
    expect(res.body.pipeline).toMatchObject({
      id: pipelineId,
      stepPosition: 0,
      totalSteps: 1,
    });
    expect(res.body.allocations).toEqual([]);
    expect(res.body.availableToAllocate).toBe(5);
  });

  it("should return 404 for non-existent job", async () => {
    const res = await request(app).get("/jobs/999");
    expect(res.status).toBe(404);
  });

  it("should return 400 for invalid id", async () => {
    const res = await request(app).get("/jobs/abc");
    expect(res.status).toBe(400);
  });
});

describe("GET /jobs/:id/history", () => {
  it("should return empty history for a new job", async () => {
    const create = await request(app).post("/jobs").send({ productType: "Widget", quantity: 5, pipelineId });
    const res = await request(app).get(`/jobs/${create.body.id}/history`);

    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });
});

describe("GET /jobs/:id/qr", () => {
  it("should return a PNG buffer", async () => {
    const create = await request(app).post("/jobs").send({ productType: "Widget", quantity: 5, pipelineId });
    const res = await request(app).get(`/jobs/${create.body.id}/qr`);

    expect(res.status).toBe(200);
    expect(res.headers["content-type"]).toBe("image/png");
  });

  it("should return a data URL when format=dataurl", async () => {
    const create = await request(app).post("/jobs").send({ productType: "Widget", quantity: 5, pipelineId });
    const res = await request(app).get(`/jobs/${create.body.id}/qr?format=dataurl`);

    expect(res.status).toBe(200);
    expect(res.body.qr).toMatch(/^data:image\/png;base64,/);
  });
});

describe("GET /jobs/tray/:trayCode", () => {
  it("should return a job by tray code", async () => {
    await request(app).post("/jobs").send({ productType: "Widget", quantity: 5, pipelineId });
    const res = await request(app).get("/jobs/tray/TRAY-0001");

    expect(res.status).toBe(200);
    expect(res.body.trayCode).toBe("TRAY-0001");
  });

  it("should return 404 for unknown tray code", async () => {
    const res = await request(app).get("/jobs/tray/TRAY-NOPE");
    expect(res.status).toBe(404);
  });
});

describe("allocation endpoints", () => {
  async function createOrderWithLine(): Promise<{ orderId: number; lineId: number }> {
    const res = await request(app).post("/customer-orders").send({
      customerName: "Acme",
      lines: [{ productType: "Widget", quantity: 10 }],
    });
    return { orderId: res.body.id, lineId: res.body.lines[0].id };
  }

  describe("POST /jobs/:id/allocations", () => {
    it("should create an allocation and return 201", async () => {
      const { lineId } = await createOrderWithLine();
      const job = await request(app).post("/jobs").send({ productType: "Widget", quantity: 20, pipelineId });

      const res = await request(app)
        .post(`/jobs/${job.body.id}/allocations`)
        .send({ orderLineId: lineId, quantity: 5 });

      expect(res.status).toBe(201);
      expect(res.body.jobId).toBe(job.body.id);
      expect(res.body.orderLineId).toBe(lineId);
      expect(res.body.quantity).toBe(5);
    });

    it("should return 400 when orderLineId is missing", async () => {
      const job = await request(app).post("/jobs").send({ productType: "Widget", quantity: 20, pipelineId });
      const res = await request(app)
        .post(`/jobs/${job.body.id}/allocations`)
        .send({ quantity: 5 });

      expect(res.status).toBe(400);
    });

    it("should return 422 when allocation exceeds job capacity", async () => {
      const { lineId } = await createOrderWithLine();
      const job = await request(app).post("/jobs").send({ productType: "Widget", quantity: 3, pipelineId });

      const res = await request(app)
        .post(`/jobs/${job.body.id}/allocations`)
        .send({ orderLineId: lineId, quantity: 10 });

      expect(res.status).toBe(422);
      expect(res.body.error).toMatch(/unallocated|Cannot allocate/i);
    });

    it("should return 422 when job product type does not match order line", async () => {
      const order = await request(app).post("/customer-orders").send({
        customerName: "Mismatch",
        lines: [{ productType: "Gadget", quantity: 5 }],
      });
      const job = await request(app).post("/jobs").send({ productType: "Widget", quantity: 20, pipelineId });

      const res = await request(app)
        .post(`/jobs/${job.body.id}/allocations`)
        .send({ orderLineId: order.body.lines[0].id, quantity: 3 });

      expect(res.status).toBe(422);
      expect(res.body.error).toContain("mismatch");
    });
  });

  describe("GET /jobs/:id/allocations", () => {
    it("should list allocations for a job", async () => {
      const { lineId } = await createOrderWithLine();
      const job = await request(app).post("/jobs").send({ productType: "Widget", quantity: 20, pipelineId });

      await request(app)
        .post(`/jobs/${job.body.id}/allocations`)
        .send({ orderLineId: lineId, quantity: 5 });

      const res = await request(app).get(`/jobs/${job.body.id}/allocations`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveLength(1);
    });
  });

  describe("DELETE /jobs/:id/allocations/:allocationId", () => {
    it("should delete an allocation and return 204", async () => {
      const { lineId } = await createOrderWithLine();
      const job = await request(app).post("/jobs").send({ productType: "Widget", quantity: 20, pipelineId });

      const allocRes = await request(app)
        .post(`/jobs/${job.body.id}/allocations`)
        .send({ orderLineId: lineId, quantity: 5 });

      const res = await request(app).delete(`/jobs/${job.body.id}/allocations/${allocRes.body.id}`);
      expect(res.status).toBe(204);
    });

    it("should return 404 for non-existent allocation", async () => {
      const job = await request(app).post("/jobs").send({ productType: "Widget", quantity: 20, pipelineId });
      const res = await request(app).delete(`/jobs/${job.body.id}/allocations/999`);
      expect(res.status).toBe(404);
    });
  });
});

describe("DELETE /jobs/:id", () => {
  it("should delete a pending job and return 204", async () => {
    const job = await request(app).post("/jobs").send({ productType: "Widget", quantity: 5, pipelineId });
    const res = await request(app).delete(`/jobs/${job.body.id}`);
    expect(res.status).toBe(204);

    const get = await request(app).get(`/jobs/${job.body.id}`);
    expect(get.status).toBe(404);
  });

  it("should return 409 for in-progress job without force", async () => {
    const job = await request(app).post("/jobs").send({ productType: "Widget", quantity: 5, pipelineId });
    db.prepare("UPDATE jobs SET status = 'in_progress' WHERE id = ?").run(job.body.id);

    const res = await request(app).delete(`/jobs/${job.body.id}`);
    expect(res.status).toBe(409);
    expect(res.body.error).toContain("in progress");
  });

  it("should delete in-progress job with force=true", async () => {
    const job = await request(app).post("/jobs").send({ productType: "Widget", quantity: 5, pipelineId });
    db.prepare("UPDATE jobs SET status = 'in_progress' WHERE id = ?").run(job.body.id);

    const res = await request(app).delete(`/jobs/${job.body.id}?force=true`);
    expect(res.status).toBe(204);
  });

  it("should return 404 for non-existent job", async () => {
    const res = await request(app).delete("/jobs/999");
    expect(res.status).toBe(404);
  });
});
