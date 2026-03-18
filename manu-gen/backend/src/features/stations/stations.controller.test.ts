import { describe, it, expect, beforeEach } from "vitest";
import request from "supertest";
import { app } from "../../app.js";
import db from "../../db.js";

beforeEach(() => {
  db.exec("DELETE FROM tracking_events");
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
  });

  it("should default location to empty string", async () => {
    const res = await request(app).post("/stations").send({ name: "Casting" });

    expect(res.status).toBe(201);
    expect(res.body.location).toBe("");
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
