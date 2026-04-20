import { describe, it, expect, beforeEach } from "vitest";
import request from "supertest";
import { app } from "../../app.js";
import db from "../../db.js";
import * as pipelinesService from "../pipelines/pipelines.service.js";

beforeEach(() => {
  db.exec("DELETE FROM tracking_events");
  db.exec("DELETE FROM job_allocations");
  db.exec("DELETE FROM order_lines");
  db.exec("DELETE FROM customer_orders");
  db.exec("DELETE FROM jobs");
  db.exec("DELETE FROM pipeline_steps");
  db.exec("DELETE FROM pipelines");
  db.exec("DELETE FROM stations");
});

describe("POST /stations", () => {
  it("should create a station and return 201", async () => {
    const res = await request(app).post("/stations").send({
      name: "Polishing",
      location: "Floor 2",
    });

    expect(res.status).toBe(201);
    expect(res.body.id).toMatch(/^station-/);
    expect(res.body.name).toBe("Polishing");
    expect(res.body.location).toBe("Floor 2");
    expect(res.body.eyeId).toBeNull();
    expect(res.body.slotCapacity).toBe(1);
  });

  it("should default location to empty string", async () => {
    const res = await request(app).post("/stations").send({ name: "Casting" });

    expect(res.status).toBe(201);
    expect(res.body.location).toBe("");
    expect(res.body.slotCapacity).toBe(1);
  });

  it("should persist slotCapacity when provided", async () => {
    const res = await request(app).post("/stations").send({
      name: "Finishing",
      location: "Line A",
      slotCapacity: 12,
    });

    expect(res.status).toBe(201);
    expect(res.body.slotCapacity).toBe(12);
  });

  it("should return 400 when slotCapacity is out of range", async () => {
    const tooLow = await request(app).post("/stations").send({ name: "A", slotCapacity: 0 });
    expect(tooLow.status).toBe(400);

    const tooHigh = await request(app).post("/stations").send({ name: "B", slotCapacity: 16 });
    expect(tooHigh.status).toBe(400);
  });

  it("should return 400 when slotCapacity is not coercible to a valid integer", async () => {
    const notANumber = await request(app).post("/stations").send({ name: "A", slotCapacity: "nope" });
    expect(notANumber.status).toBe(400);

    const nullCap = await request(app).post("/stations").send({ name: "B", slotCapacity: null });
    expect(nullCap.status).toBe(400);
  });

  it("should return 400 when name is missing", async () => {
    const res = await request(app).post("/stations").send({});

    expect(res.status).toBe(400);
    expect(res.body.error).toContain("name");
  });

  it("should return 400 when name is empty", async () => {
    const res = await request(app).post("/stations").send({ name: "" });

    expect(res.status).toBe(400);
    expect(res.body.error).toContain("name");
  });
});

describe("GET /stations", () => {
  it("should return empty array when no stations exist", async () => {
    const res = await request(app).get("/stations");

    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });

  it("should return 400 when limit exceeds MAX_PAGE_SIZE", async () => {
    const res = await request(app).get("/stations?limit=101");

    expect(res.status).toBe(400);
    expect(res.body.error).toContain("limit");
  });

  it("should return 400 when offset is negative", async () => {
    const res = await request(app).get("/stations?offset=-1");

    expect(res.status).toBe(400);
    expect(res.body.error).toContain("offset");
  });
});

describe("PUT /stations/:id", () => {
  it("should update name and location", async () => {
    const createRes = await request(app).post("/stations").send({ name: "Glazing", location: "A" });
    const id = createRes.body.id;

    const res = await request(app).put(`/stations/${id}`).send({ name: "Glazing Updated", location: "B" });

    expect(res.status).toBe(200);
    expect(res.body.id).toBe(id);
    expect(res.body.name).toBe("Glazing Updated");
    expect(res.body.location).toBe("B");
    expect(res.body.slotCapacity).toBe(1);
  });

  it("should update slotCapacity", async () => {
    const createRes = await request(app).post("/stations").send({
      name: "Press",
      location: "North",
      slotCapacity: 3,
    });
    const id = createRes.body.id;

    const res = await request(app).put(`/stations/${id}`).send({
      name: "Press",
      location: "North",
      slotCapacity: 8,
    });

    expect(res.status).toBe(200);
    expect(res.body.slotCapacity).toBe(8);
  });

  it("should preserve slotCapacity when omitted on update", async () => {
    const createRes = await request(app).post("/stations").send({
      name: "Cure",
      slotCapacity: 5,
    });
    const id = createRes.body.id;

    const res = await request(app).put(`/stations/${id}`).send({ name: "Cure Renamed" });

    expect(res.status).toBe(200);
    expect(res.body.slotCapacity).toBe(5);
  });

  it("should return 400 when slotCapacity is out of range on update", async () => {
    const createRes = await request(app).post("/stations").send({ name: "SlotTest", slotCapacity: 4 });
    const id = createRes.body.id;

    const tooLow = await request(app).put(`/stations/${id}`).send({ name: "SlotTest", slotCapacity: 0 });
    expect(tooLow.status).toBe(400);

    const tooHigh = await request(app).put(`/stations/${id}`).send({ name: "SlotTest", slotCapacity: 20 });
    expect(tooHigh.status).toBe(400);
  });

  it("should default location to empty string when omitted", async () => {
    const createRes = await request(app).post("/stations").send({ name: "Moulding", location: "X" });
    const id = createRes.body.id;

    const res = await request(app).put(`/stations/${id}`).send({ name: "Moulding" });

    expect(res.status).toBe(200);
    expect(res.body.location).toBe("");
  });

  it("should return 404 when station does not exist", async () => {
    const res = await request(app).put("/stations/nonexistent").send({ name: "Nope" });

    expect(res.status).toBe(404);
  });

  it("should return 400 when name is empty", async () => {
    const createRes = await request(app).post("/stations").send({ name: "OK" });
    const id = createRes.body.id;

    const res = await request(app).put(`/stations/${id}`).send({ name: "" });

    expect(res.status).toBe(400);
  });
});

describe("GET /stations/:id", () => {
  it("should return the station when it exists", async () => {
    const createRes = await request(app).post("/stations").send({ name: "Glazing" });
    const id = createRes.body.id;

    const res = await request(app).get(`/stations/${id}`);

    expect(res.status).toBe(200);
    expect(res.body.id).toBe(id);
    expect(res.body.name).toBe("Glazing");
  });

  it("should return 404 when station does not exist", async () => {
    const res = await request(app).get("/stations/nonexistent");

    expect(res.status).toBe(404);
  });

  it("should return 400 when id exceeds max length", async () => {
    const longId = "x".repeat(51);
    const res = await request(app).get(`/stations/${longId}`);

    expect(res.status).toBe(400);
    expect(res.body.error).toContain("Station id");
  });
});

describe("PUT /stations/:id/eye", () => {
  it("should assign an eye to a station", async () => {
    const createRes = await request(app).post("/stations").send({ name: "Casting" });
    const id = createRes.body.id;

    const res = await request(app).put(`/stations/${id}/eye`).send({ eyeId: "eye-1" });

    expect(res.status).toBe(200);
    expect(res.body.eyeId).toBe("eye-1");
  });

  it("should return 400 when eyeId is missing", async () => {
    const createRes = await request(app).post("/stations").send({ name: "Casting" });
    const id = createRes.body.id;

    const res = await request(app).put(`/stations/${id}/eye`).send({});

    expect(res.status).toBe(400);
    expect(res.body.error).toContain("eyeId");
  });

  it("should return 404 when station does not exist", async () => {
    const res = await request(app).put("/stations/nonexistent/eye").send({ eyeId: "eye-1" });

    expect(res.status).toBe(404);
  });
});

describe("DELETE /stations/:id/eye", () => {
  it("should unassign the eye and return the station", async () => {
    const createRes = await request(app).post("/stations").send({ name: "Casting" });
    const id = createRes.body.id;
    await request(app).put(`/stations/${id}/eye`).send({ eyeId: "eye-1" });

    const res = await request(app).delete(`/stations/${id}/eye`);

    expect(res.status).toBe(200);
    expect(res.body.eyeId).toBeNull();
  });

  it("should return 400 when station has no eye assigned", async () => {
    const createRes = await request(app).post("/stations").send({ name: "Casting" });
    const id = createRes.body.id;

    const res = await request(app).delete(`/stations/${id}/eye`);

    expect(res.status).toBe(400);
  });

  it("should return 404 when station does not exist", async () => {
    const res = await request(app).delete("/stations/nonexistent/eye");

    expect(res.status).toBe(404);
  });
});

describe("DELETE /stations/:id", () => {
  it("should delete a station and return 204", async () => {
    const createRes = await request(app).post("/stations").send({ name: "Casting" });
    const id = createRes.body.id;

    const res = await request(app).delete(`/stations/${id}`);

    expect(res.status).toBe(204);

    const getRes = await request(app).get(`/stations/${id}`);
    expect(getRes.status).toBe(404);
  });

  it("should cascade-delete station with tracking events", async () => {
    const createRes = await request(app).post("/stations").send({ name: "Casting" });
    const id = createRes.body.id;
    db.prepare(
      `INSERT INTO tracking_events (tray_code, station_id, eye_id, captured_at) VALUES (?, ?, ?, ?)`,
    ).run("TRAY-001", id, "eye-1", "2025-01-01T00:00:00Z");

    const res = await request(app).delete(`/stations/${id}`);

    expect(res.status).toBe(204);

    const getRes = await request(app).get(`/stations/${id}`);
    expect(getRes.status).toBe(404);
  });

  it("should return 404 when station does not exist", async () => {
    const res = await request(app).delete("/stations/nonexistent");

    expect(res.status).toBe(404);
  });

  it("should return 409 when station is used in a pipeline", async () => {
    const createRes = await request(app).post("/stations").send({ name: "Busy" });
    const id = createRes.body.id;

    pipelinesService.createPipeline({
      name: "Flow",
      productType: "Widget",
      steps: [{ stationId: id, maxDurationSeconds: null }],
    });

    const res = await request(app).delete(`/stations/${id}`);

    expect(res.status).toBe(409);
    expect(res.body.error).toContain("pipeline");
  });
});
