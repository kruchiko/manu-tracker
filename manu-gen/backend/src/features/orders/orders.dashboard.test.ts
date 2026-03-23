import { describe, it, expect, beforeEach } from "vitest";
import db from "../../db.js";
import * as ordersService from "./orders.service.js";
import * as stationsService from "../stations/stations.service.js";
import * as eventsService from "../events/events.service.js";

beforeEach(() => {
  db.exec("DELETE FROM tracking_events");
  db.exec("DELETE FROM orders");
  db.exec("DELETE FROM stations");
  db.exec("DELETE FROM sqlite_sequence WHERE name = 'orders'");
  db.exec("DELETE FROM sqlite_sequence WHERE name = 'tracking_events'");
});

describe("getOrderBoard", () => {
  it("should return empty array when no orders exist", () => {
    expect(ordersService.getOrderBoard()).toEqual([]);
  });

  it("should return orders with null station when no events exist", () => {
    ordersService.createOrder({ customerName: "AlphaTech", productType: "Crown", quantity: 1 });

    const board = ordersService.getOrderBoard();
    expect(board).toHaveLength(1);
    expect(board[0].orderNumber).toBe("ORD-0001");
    expect(board[0].currentStation).toBeNull();
    expect(board[0].lastSeenAt).toBeNull();
  });

  it("should return the latest station for an order with events", () => {
    const order = ordersService.createOrder({ customerName: "AlphaTech", productType: "Crown", quantity: 1 });
    const station1 = stationsService.createStation({ name: "Moulding" });
    const station2 = stationsService.createStation({ name: "Drying Room" });

    eventsService.createEvent({
      trayCode: order.trayCode,
      stationId: station1.id,
      eyeId: "eye-1",
      capturedAt: "2026-03-18T10:00:00",
    });
    eventsService.createEvent({
      trayCode: order.trayCode,
      stationId: station2.id,
      eyeId: "eye-2",
      capturedAt: "2026-03-18T12:00:00",
    });

    const board = ordersService.getOrderBoard();
    expect(board).toHaveLength(1);
    expect(board[0].currentStation).toEqual({ id: station2.id, name: "Drying Room" });
    expect(board[0].lastSeenAt).toBe("2026-03-18T12:00:00");
  });

  it("should sort orders with longest wait first, unseen last", () => {
    const order1 = ordersService.createOrder({ customerName: "A", productType: "X", quantity: 1 });
    ordersService.createOrder({ customerName: "B", productType: "Y", quantity: 1 });
    const order3 = ordersService.createOrder({ customerName: "C", productType: "Z", quantity: 1 });

    const station = stationsService.createStation({ name: "Moulding" });

    eventsService.createEvent({
      trayCode: order1.trayCode,
      stationId: station.id,
      eyeId: "eye-1",
      capturedAt: "2026-03-18T14:00:00",
    });
    eventsService.createEvent({
      trayCode: order3.trayCode,
      stationId: station.id,
      eyeId: "eye-1",
      capturedAt: "2026-03-18T10:00:00",
    });

    const board = ordersService.getOrderBoard();
    expect(board).toHaveLength(3);
    expect(board[0].customerName).toBe("C");
    expect(board[1].customerName).toBe("A");
    expect(board[2].customerName).toBe("B");
  });

  it("should normalize space-separated SQLite datetimes to ISO format", () => {
    const order = ordersService.createOrder({ customerName: "A", productType: "X", quantity: 1 });
    const station = stationsService.createStation({ name: "Moulding" });

    db.prepare(
      "INSERT INTO tracking_events (tray_code, station_id, eye_id, captured_at) VALUES (?, ?, ?, ?)",
    ).run(order.trayCode, station.id, "eye-1", "2026-03-18 14:30:00");

    const board = ordersService.getOrderBoard();
    expect(board).toHaveLength(1);
    expect(board[0].lastSeenAt).toBe("2026-03-18T14:30:00");
    expect(board[0].createdAt).not.toContain(" ");
  });

  it("should handle Z-suffixed timestamps from eye scanners without double-Z", () => {
    const order = ordersService.createOrder({ customerName: "A", productType: "X", quantity: 1 });
    const station = stationsService.createStation({ name: "Moulding" });

    db.prepare(
      "INSERT INTO tracking_events (tray_code, station_id, eye_id, captured_at) VALUES (?, ?, ?, ?)",
    ).run(order.trayCode, station.id, "eye-1", "2026-03-18T14:30:00Z");

    const board = ordersService.getOrderBoard();
    expect(board).toHaveLength(1);
    expect(board[0].lastSeenAt).toBe("2026-03-18T14:30:00");
    expect(board[0].lastSeenAt).not.toContain("Z");
  });

  it("should clear current station when latest event is departed", () => {
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
      capturedAt: "2026-03-18T11:00:00",
      phase: "departed",
    });

    const board = ordersService.getOrderBoard();
    expect(board[0].currentStation).toBeNull();
    expect(board[0].lastSeenAt).toBe("2026-03-18T11:00:00");
    expect(board[0].stationArrivedAt).toBeNull();
  });

  it("should return stationArrivedAt when tray is currently at a station", () => {
    const order = ordersService.createOrder({ customerName: "A", productType: "X", quantity: 1 });
    const station = stationsService.createStation({ name: "Moulding" });

    eventsService.createEvent({
      trayCode: order.trayCode,
      stationId: station.id,
      eyeId: "eye-1",
      capturedAt: "2026-03-18T10:00:00",
      phase: "arrived",
    });

    const board = ordersService.getOrderBoard();
    expect(board[0].currentStation).toEqual({ id: station.id, name: "Moulding" });
    expect(board[0].stationArrivedAt).toBe("2026-03-18T10:00:00");
  });

  it("should return null stationArrivedAt when no events exist", () => {
    ordersService.createOrder({ customerName: "A", productType: "X", quantity: 1 });

    const board = ordersService.getOrderBoard();
    expect(board[0].stationArrivedAt).toBeNull();
  });

  it("should return latest arrived time after re-arrival at same station", () => {
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
      capturedAt: "2026-03-18T10:30:00",
      phase: "departed",
    });
    eventsService.createEvent({
      trayCode: order.trayCode,
      stationId: station.id,
      eyeId: "eye-1",
      capturedAt: "2026-03-18T11:00:00",
      phase: "arrived",
    });

    const board = ordersService.getOrderBoard();
    expect(board[0].currentStation).toEqual({ id: station.id, name: "Polishing" });
    expect(board[0].stationArrivedAt).toBe("2026-03-18T11:00:00");
  });
});

describe("getOrderHistory", () => {
  it("should return empty array when order has no events", () => {
    const order = ordersService.createOrder({ customerName: "A", productType: "X", quantity: 1 });
    expect(ordersService.getOrderHistory(order.id)).toEqual([]);
  });

  it("should throw 404 for non-existent order", () => {
    expect(() => ordersService.getOrderHistory(999)).toThrow(
      expect.objectContaining({ statusCode: 404 }),
    );
  });

  it("should return timeline with computed durations", () => {
    const order = ordersService.createOrder({ customerName: "A", productType: "X", quantity: 1 });
    const station1 = stationsService.createStation({ name: "Moulding" });
    const station2 = stationsService.createStation({ name: "Drying Room" });
    const station3 = stationsService.createStation({ name: "Kiln" });

    eventsService.createEvent({
      trayCode: order.trayCode,
      stationId: station1.id,
      eyeId: "eye-1",
      capturedAt: "2026-03-18T10:00:00",
    });
    eventsService.createEvent({
      trayCode: order.trayCode,
      stationId: station2.id,
      eyeId: "eye-2",
      capturedAt: "2026-03-18T11:00:00",
    });
    eventsService.createEvent({
      trayCode: order.trayCode,
      stationId: station3.id,
      eyeId: "eye-3",
      capturedAt: "2026-03-18T13:30:00",
    });

    const history = ordersService.getOrderHistory(order.id);
    expect(history).toHaveLength(3);

    expect(history[0].phase).toBe("scan");
    expect(history[0].station).toBe("Moulding");
    expect(history[0].at).toBe("2026-03-18T10:00:00");
    expect(history[0].durationSeconds).toBe(3600);

    expect(history[1].phase).toBe("scan");
    expect(history[1].station).toBe("Drying Room");
    expect(history[1].durationSeconds).toBe(9000);

    expect(history[2].phase).toBe("scan");
    expect(history[2].station).toBe("Kiln");
    expect(history[2].durationSeconds).toBeNull();
  });

  it("should normalize space-separated datetimes and compute correct durations", () => {
    const order = ordersService.createOrder({ customerName: "A", productType: "X", quantity: 1 });
    const station1 = stationsService.createStation({ name: "Moulding" });
    const station2 = stationsService.createStation({ name: "Drying" });

    const insertEvent = db.prepare(
      "INSERT INTO tracking_events (tray_code, station_id, eye_id, captured_at) VALUES (?, ?, ?, ?)",
    );
    insertEvent.run(order.trayCode, station1.id, "eye-1", "2026-03-18 10:00:00");
    insertEvent.run(order.trayCode, station2.id, "eye-2", "2026-03-18 11:30:00");

    const history = ordersService.getOrderHistory(order.id);
    expect(history).toHaveLength(2);
    expect(history[0].at).toBe("2026-03-18T10:00:00");
    expect(history[0].phase).toBe("scan");
    expect(history[0].durationSeconds).toBe(5400);
    expect(history[1].at).toBe("2026-03-18T11:30:00");
  });

  it("should handle Z-suffixed timestamps without double-Z in arrivedAt", () => {
    const order = ordersService.createOrder({ customerName: "A", productType: "X", quantity: 1 });
    const station1 = stationsService.createStation({ name: "Moulding" });
    const station2 = stationsService.createStation({ name: "Drying" });

    const insertEvent = db.prepare(
      "INSERT INTO tracking_events (tray_code, station_id, eye_id, captured_at) VALUES (?, ?, ?, ?)",
    );
    insertEvent.run(order.trayCode, station1.id, "eye-1", "2026-03-18T10:00:00Z");
    insertEvent.run(order.trayCode, station2.id, "eye-2", "2026-03-18T11:30:00Z");

    const history = ordersService.getOrderHistory(order.id);
    expect(history).toHaveLength(2);
    expect(history[0].at).toBe("2026-03-18T10:00:00");
    expect(history[0].at).not.toContain("Z");
    expect(history[0].durationSeconds).toBe(5400);
  });

  it("should pair arrived and departed for duration and support repeat visits at same station", () => {
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
      capturedAt: "2026-03-18T10:30:00",
      phase: "departed",
    });
    eventsService.createEvent({
      trayCode: order.trayCode,
      stationId: station.id,
      eyeId: "eye-1",
      capturedAt: "2026-03-18T11:00:00",
      phase: "arrived",
    });

    const history = ordersService.getOrderHistory(order.id);
    expect(history).toHaveLength(3);
    expect(history[0].phase).toBe("arrived");
    expect(history[1].phase).toBe("departed");
    expect(history[1].durationSeconds).toBe(1800);
    expect(history[2].phase).toBe("arrived");
    expect(history[2].durationSeconds).toBeNull();
  });
});
