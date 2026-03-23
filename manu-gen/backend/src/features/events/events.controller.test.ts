import { describe, it, expect, beforeEach } from "vitest";
import request from "supertest";
import { app } from "../../app.js";
import db from "../../db.js";

let testStationId: string;

beforeEach(async () => {
  db.exec("DELETE FROM tracking_events");
  db.exec("DELETE FROM stations");
  db.exec("DELETE FROM sqlite_sequence WHERE name = 'tracking_events'");

  const stationRes = await request(app).post("/stations").send({ name: "Test Station" });
  testStationId = stationRes.body.id;
  await request(app).put(`/stations/${testStationId}/eye`).send({ eyeId: "eye-1" });
});

describe("POST /events", () => {
  it("should create an event and return 201", async () => {
    const res = await request(app).post("/events").send({
      trayCode: "TRAY-0001",
      stationId: testStationId,
      eyeId: "eye-1",
      capturedAt: "2026-03-18T14:30:00.000Z",
    });

    expect(res.status).toBe(201);
    expect(res.body.id).toBe(1);
    expect(res.body.trayCode).toBe("TRAY-0001");
    expect(res.body.stationId).toBe(testStationId);
    expect(res.body.eyeId).toBe("eye-1");
    expect(res.body.capturedAt).toBe("2026-03-18T14:30:00.000Z");
    expect(res.body.receivedAt).toBeTruthy();
    expect(res.body.phase).toBe("scan");
  });

  it("should accept phase arrived", async () => {
    const res = await request(app).post("/events").send({
      trayCode: "TRAY-0001",
      stationId: testStationId,
      eyeId: "eye-1",
      capturedAt: "2026-03-18T14:30:00.000Z",
      phase: "arrived",
    });

    expect(res.status).toBe(201);
    expect(res.body.phase).toBe("arrived");
  });

  it("should return 400 when phase is invalid", async () => {
    const res = await request(app).post("/events").send({
      trayCode: "TRAY-0001",
      stationId: testStationId,
      eyeId: "eye-1",
      capturedAt: "2026-03-18T14:30:00.000Z",
      phase: "nope",
    });

    expect(res.status).toBe(400);
  });

  it("should return 400 when trayCode is missing", async () => {
    const res = await request(app).post("/events").send({
      stationId: testStationId,
      eyeId: "eye-1",
      capturedAt: "2026-03-18T14:30:00.000Z",
    });

    expect(res.status).toBe(400);
    expect(res.body.error).toContain("trayCode");
  });

  it("should return 400 when capturedAt is not a valid ISO datetime", async () => {
    const res = await request(app).post("/events").send({
      trayCode: "TRAY-0001",
      stationId: testStationId,
      eyeId: "eye-1",
      capturedAt: "banana",
    });

    expect(res.status).toBe(400);
    expect(res.body.error).toContain("capturedAt");
  });

  it("should return 400 when body is empty", async () => {
    const res = await request(app).post("/events").send({});

    expect(res.status).toBe(400);
  });
});

describe("GET /events", () => {
  it("should return empty array when no events exist", async () => {
    const res = await request(app).get("/events");

    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });

  it("should return events after creation", async () => {
    await request(app).post("/events").send({
      trayCode: "TRAY-0001",
      stationId: testStationId,
      eyeId: "eye-1",
      capturedAt: "2026-03-18T14:30:00.000Z",
    });

    const res = await request(app).get("/events");

    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
    expect(res.body[0].trayCode).toBe("TRAY-0001");
  });

  it("should return 400 when limit exceeds MAX_PAGE_SIZE", async () => {
    const res = await request(app).get("/events?limit=101");

    expect(res.status).toBe(400);
    expect(res.body.error).toContain("limit");
  });

  it("should return 400 when offset is negative", async () => {
    const res = await request(app).get("/events?offset=-1");

    expect(res.status).toBe(400);
    expect(res.body.error).toContain("offset");
  });
});
