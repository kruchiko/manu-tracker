import { describe, it, expect, beforeEach } from "vitest";
import db from "../../db.js";
import * as analyticsService from "./analytics.service.js";
import * as ordersService from "../orders/orders.service.js";
import * as stationsService from "../stations/stations.service.js";
import * as eventsService from "../events/events.service.js";

beforeEach(() => {
  db.exec("DELETE FROM tracking_events");
  db.exec("DELETE FROM orders");
  db.exec("DELETE FROM stations");
  db.exec("DELETE FROM sqlite_sequence WHERE name = 'orders'");
  db.exec("DELETE FROM sqlite_sequence WHERE name = 'tracking_events'");
});

describe("getStationDurations", () => {
  it("should return empty array when no events exist", () => {
    expect(analyticsService.getStationDurations()).toEqual([]);
  });

  it("should exclude stations where the order is still present (no next event)", () => {
    const order = ordersService.createOrder({ customerName: "A", productType: "X", quantity: 1 });
    const station = stationsService.createStation({ name: "Moulding" });

    eventsService.createEvent({
      trayCode: order.trayCode,
      stationId: station.id,
      eyeId: "eye-1",
      capturedAt: "2026-03-18T10:00:00",
    });

    expect(analyticsService.getStationDurations()).toEqual([]);
  });

  it("should compute avg and max durations across orders", () => {
    const order1 = ordersService.createOrder({ customerName: "A", productType: "X", quantity: 1 });
    const order2 = ordersService.createOrder({ customerName: "B", productType: "Y", quantity: 1 });
    const station1 = stationsService.createStation({ name: "Moulding" });
    const station2 = stationsService.createStation({ name: "Drying Room" });

    eventsService.createEvent({
      trayCode: order1.trayCode,
      stationId: station1.id,
      eyeId: "eye-1",
      capturedAt: "2026-03-18T10:00:00",
    });
    eventsService.createEvent({
      trayCode: order1.trayCode,
      stationId: station2.id,
      eyeId: "eye-2",
      capturedAt: "2026-03-18T11:00:00",
    });

    eventsService.createEvent({
      trayCode: order2.trayCode,
      stationId: station1.id,
      eyeId: "eye-1",
      capturedAt: "2026-03-18T12:00:00",
    });
    eventsService.createEvent({
      trayCode: order2.trayCode,
      stationId: station2.id,
      eyeId: "eye-2",
      capturedAt: "2026-03-18T14:00:00",
    });

    const durations = analyticsService.getStationDurations();
    const moulding = durations.find((d) => d.stationName === "Moulding");
    expect(moulding).toBeDefined();
    expect(moulding!.orderCount).toBe(2);
    expect(moulding!.avgSeconds).toBe(5400);
    expect(moulding!.maxSeconds).toBe(7200);
  });

  it("should compute correct durations with Z-suffixed timestamps", () => {
    const order = ordersService.createOrder({ customerName: "A", productType: "X", quantity: 1 });
    const station1 = stationsService.createStation({ name: "Moulding" });
    const station2 = stationsService.createStation({ name: "Drying Room" });

    eventsService.createEvent({
      trayCode: order.trayCode,
      stationId: station1.id,
      eyeId: "eye-1",
      capturedAt: "2026-03-18T10:00:00Z",
    });
    eventsService.createEvent({
      trayCode: order.trayCode,
      stationId: station2.id,
      eyeId: "eye-2",
      capturedAt: "2026-03-18T12:00:00Z",
    });

    const durations = analyticsService.getStationDurations();
    const moulding = durations.find((d) => d.stationName === "Moulding");
    expect(moulding).toBeDefined();
    expect(moulding!.avgSeconds).toBe(7200);
    expect(moulding!.maxSeconds).toBe(7200);
  });

  it("should count each arrived-departed visit separately at the same station", () => {
    const order = ordersService.createOrder({ customerName: "A", productType: "X", quantity: 1 });
    const station = stationsService.createStation({ name: "Polishing" });

    eventsService.createEvent({
      trayCode: order.trayCode,
      stationId: station.id,
      eyeId: "eye-1",
      capturedAt: "2026-03-18T10:00:00",
      phase: "arrived",
    });
    eventsService.createEvent({
      trayCode: order.trayCode,
      stationId: station.id,
      eyeId: "eye-1",
      capturedAt: "2026-03-18T10:10:00",
      phase: "departed",
    });
    eventsService.createEvent({
      trayCode: order.trayCode,
      stationId: station.id,
      eyeId: "eye-1",
      capturedAt: "2026-03-18T11:00:00",
      phase: "arrived",
    });
    eventsService.createEvent({
      trayCode: order.trayCode,
      stationId: station.id,
      eyeId: "eye-1",
      capturedAt: "2026-03-18T11:30:00",
      phase: "departed",
    });

    const durations = analyticsService.getStationDurations();
    const polishing = durations.find((d) => d.stationName === "Polishing");
    expect(polishing).toBeDefined();
    expect(polishing!.orderCount).toBe(1);
    expect(polishing!.avgSeconds).toBe(1200);
    expect(polishing!.maxSeconds).toBe(1800);
  });
});
