import { describe, it, expect, beforeEach } from "vitest";
import request from "supertest";
import { app } from "../../app.js";
import db from "../../db.js";

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
});

const validPayload = {
  customerName: "Acme Corp",
  lines: [{ productType: "Widget", quantity: 10 }],
};

describe("POST /customer-orders", () => {
  it("should create an order and return 201", async () => {
    const res = await request(app).post("/customer-orders").send(validPayload);

    expect(res.status).toBe(201);
    expect(res.body.orderNumber).toBe("CO-0001");
    expect(res.body.customerName).toBe("Acme Corp");
    expect(res.body.status).toBe("open");
    expect(res.body.lines).toHaveLength(1);
  });

  it("should return 400 when customerName is missing", async () => {
    const res = await request(app).post("/customer-orders").send({
      lines: [{ productType: "Widget", quantity: 10 }],
    });
    expect(res.status).toBe(400);
  });

  it("should return 400 when lines array is empty", async () => {
    const res = await request(app).post("/customer-orders").send({
      customerName: "Acme",
      lines: [],
    });
    expect(res.status).toBe(400);
  });

  it("should return 400 when dueDate has invalid format", async () => {
    const res = await request(app).post("/customer-orders").send({
      ...validPayload,
      dueDate: "not-a-date",
    });
    expect(res.status).toBe(400);
  });

  it("should accept valid dueDate", async () => {
    const res = await request(app).post("/customer-orders").send({
      ...validPayload,
      dueDate: "2026-12-31",
    });
    expect(res.status).toBe(201);
    expect(res.body.dueDate).toBe("2026-12-31");
  });
});

describe("GET /customer-orders", () => {
  it("should return empty array when no orders exist", async () => {
    const res = await request(app).get("/customer-orders");
    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });

  it("should return orders after creation", async () => {
    await request(app).post("/customer-orders").send(validPayload);
    const res = await request(app).get("/customer-orders");

    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
    expect(res.body[0].customerName).toBe("Acme Corp");
    expect(res.body[0].lineCount).toBe(1);
  });

  it("should return 400 when limit exceeds MAX_PAGE_SIZE", async () => {
    const res = await request(app).get("/customer-orders?limit=101");
    expect(res.status).toBe(400);
  });

  it("should return 400 when offset is negative", async () => {
    const res = await request(app).get("/customer-orders?offset=-1");
    expect(res.status).toBe(400);
  });
});

describe("GET /customer-orders/:id", () => {
  it("should return a specific order", async () => {
    const create = await request(app).post("/customer-orders").send(validPayload);
    const res = await request(app).get(`/customer-orders/${create.body.id}`);

    expect(res.status).toBe(200);
    expect(res.body.customerName).toBe("Acme Corp");
    expect(res.body.lines).toHaveLength(1);
  });

  it("should return 404 for non-existent order", async () => {
    const res = await request(app).get("/customer-orders/999");
    expect(res.status).toBe(404);
  });
});

describe("PATCH /customer-orders/:id", () => {
  it("should update an order", async () => {
    const create = await request(app).post("/customer-orders").send(validPayload);
    const res = await request(app)
      .patch(`/customer-orders/${create.body.id}`)
      .send({ customerName: "Updated" });

    expect(res.status).toBe(200);
    expect(res.body.customerName).toBe("Updated");
  });

  it("should update status to in_progress", async () => {
    const create = await request(app).post("/customer-orders").send(validPayload);
    const res = await request(app)
      .patch(`/customer-orders/${create.body.id}`)
      .send({ status: "in_progress" });

    expect(res.status).toBe(200);
    expect(res.body.status).toBe("in_progress");
  });

  it("should return 400 for invalid status", async () => {
    const create = await request(app).post("/customer-orders").send(validPayload);
    const res = await request(app)
      .patch(`/customer-orders/${create.body.id}`)
      .send({ status: "invalid_status" });

    expect(res.status).toBe(400);
  });

  it("should return 404 for non-existent order", async () => {
    const res = await request(app).patch("/customer-orders/999").send({ notes: "test" });
    expect(res.status).toBe(404);
  });
});

describe("DELETE /customer-orders/:id", () => {
  it("should delete an order and return 204", async () => {
    const create = await request(app).post("/customer-orders").send(validPayload);
    const res = await request(app).delete(`/customer-orders/${create.body.id}`);

    expect(res.status).toBe(204);
  });

  it("should return 404 for non-existent order", async () => {
    const res = await request(app).delete("/customer-orders/999");
    expect(res.status).toBe(404);
  });
});
