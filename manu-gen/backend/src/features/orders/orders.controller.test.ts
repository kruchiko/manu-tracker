import { describe, it, expect, beforeEach } from "vitest";
import request from "supertest";
import { app } from "../../app.js";
import db from "../../db.js";
import * as stationsService from "../stations/stations.service.js";
import * as pipelinesService from "../pipelines/pipelines.service.js";

let testPipelineId: string;

beforeEach(() => {
  db.exec("DELETE FROM tracking_events");
  db.exec("DELETE FROM orders");
  db.exec("DELETE FROM pipeline_steps");
  db.exec("DELETE FROM pipelines");
  db.exec("DELETE FROM stations");
  db.exec("DELETE FROM sqlite_sequence WHERE name = 'orders'");

  const station = stationsService.createStation({ name: "Test Station" });
  const pipeline = pipelinesService.createPipeline({
    name: "Test Pipeline",
    steps: [{ stationId: station.id, maxDurationSeconds: 120 }],
  });
  testPipelineId = pipeline.id;
});

describe("POST /orders", () => {
  it("should create an order and return 201", async () => {
    const res = await request(app).post("/orders").send({
      customerName: "AlphaTech",
      productType: "Dental Crown",
      quantity: 5,
      pipelineId: testPipelineId,
    });

    expect(res.status).toBe(201);
    expect(res.body.id).toBe(1);
    expect(res.body.orderNumber).toBe("ORD-0001");
    expect(res.body.customerName).toBe("AlphaTech");
    expect(res.body.productType).toBe("Dental Crown");
    expect(res.body.quantity).toBe(5);
    expect(res.body.notes).toBe("");
    expect(res.body.pipelineId).toBe(testPipelineId);
  });

  it("should return 400 when customerName is missing", async () => {
    const res = await request(app).post("/orders").send({
      productType: "Dental Crown",
      quantity: 5,
      pipelineId: testPipelineId,
    });

    expect(res.status).toBe(400);
    expect(res.body.error).toContain("customerName");
  });

  it("should return 400 when quantity is zero", async () => {
    const res = await request(app).post("/orders").send({
      customerName: "AlphaTech",
      productType: "Dental Crown",
      quantity: 0,
      pipelineId: testPipelineId,
    });

    expect(res.status).toBe(400);
    expect(res.body.error).toContain("quantity");
  });

  it("should return 400 when pipelineId is missing", async () => {
    const res = await request(app).post("/orders").send({
      customerName: "AlphaTech",
      productType: "Dental Crown",
      quantity: 5,
    });

    expect(res.status).toBe(400);
    expect(res.body.error).toContain("pipelineId");
  });

  it("should return 400 when body is empty", async () => {
    const res = await request(app).post("/orders").send({});
    expect(res.status).toBe(400);
  });
});

describe("GET /orders", () => {
  it("should return empty array when no orders exist", async () => {
    const res = await request(app).get("/orders");
    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });

  it("should return 400 when limit is 0", async () => {
    const res = await request(app).get("/orders?limit=0");
    expect(res.status).toBe(400);
    expect(res.body.error).toContain("limit");
  });

  it("should return 400 when limit exceeds MAX_PAGE_SIZE", async () => {
    const res = await request(app).get("/orders?limit=101");
    expect(res.status).toBe(400);
    expect(res.body.error).toContain("limit");
  });

  it("should return 400 when offset is negative", async () => {
    const res = await request(app).get("/orders?offset=-1");
    expect(res.status).toBe(400);
    expect(res.body.error).toContain("offset");
  });

  it("should return 400 when limit is a float", async () => {
    const res = await request(app).get("/orders?limit=1.5");
    expect(res.status).toBe(400);
  });
});

describe("GET /orders/:id", () => {
  it("should return 400 when id is not an integer", async () => {
    const res = await request(app).get("/orders/abc");
    expect(res.status).toBe(400);
    expect(res.body.error).toContain("positive integer");
  });

  it("should return 400 when id is 0", async () => {
    const res = await request(app).get("/orders/0");
    expect(res.status).toBe(400);
  });

  it("should return 400 when id is a float", async () => {
    const res = await request(app).get("/orders/1.5");
    expect(res.status).toBe(400);
  });

  it("should return 404 when order does not exist", async () => {
    const res = await request(app).get("/orders/999");
    expect(res.status).toBe(404);
  });

  it("should return the order when it exists", async () => {
    const createRes = await request(app).post("/orders").send({
      customerName: "AlphaTech",
      productType: "Implant",
      quantity: 3,
      pipelineId: testPipelineId,
    });
    const id = createRes.body.id;

    const res = await request(app).get(`/orders/${id}`);
    expect(res.status).toBe(200);
    expect(res.body.id).toBe(id);
  });
});

describe("GET /orders/tray/:trayCode", () => {
  it("should return the order when tray code exists", async () => {
    await request(app).post("/orders").send({
      customerName: "AlphaTech",
      productType: "Implant",
      quantity: 3,
      pipelineId: testPipelineId,
    });

    const res = await request(app).get("/orders/tray/TRAY-0001");
    expect(res.status).toBe(200);
    expect(res.body.trayCode).toBe("TRAY-0001");
  });

  it("should return 404 when tray code does not exist", async () => {
    const res = await request(app).get("/orders/tray/TRAY-9999");
    expect(res.status).toBe(404);
  });

  it("should return 400 when trayCode exceeds max length", async () => {
    const longCode = "T".repeat(51);
    const res = await request(app).get(`/orders/tray/${longCode}`);
    expect(res.status).toBe(400);
  });
});

describe("GET /orders/:id/qr", () => {
  it("should return a PNG image for a valid order", async () => {
    await request(app).post("/orders").send({
      customerName: "AlphaTech",
      productType: "Dental Crown",
      quantity: 1,
      pipelineId: testPipelineId,
    });

    const res = await request(app).get("/orders/1/qr");
    expect(res.status).toBe(200);
    expect(res.headers["content-type"]).toContain("image/png");
  });

  it("should return a data URL JSON when format=dataurl", async () => {
    await request(app).post("/orders").send({
      customerName: "AlphaTech",
      productType: "Dental Crown",
      quantity: 1,
      pipelineId: testPipelineId,
    });

    const res = await request(app).get("/orders/1/qr?format=dataurl");
    expect(res.status).toBe(200);
    expect(res.body.qr).toMatch(/^data:image\/png;base64,/);
  });

  it("should return 404 when order does not exist", async () => {
    const res = await request(app).get("/orders/999/qr");
    expect(res.status).toBe(404);
  });
});
