import { describe, it, expect, beforeEach } from "vitest";
import db from "../../db.js";
import { AppError } from "../../shared/errors/app-error.js";
import * as ordersService from "./orders.service.js";

beforeEach(() => {
  db.exec("DELETE FROM orders");
  // Reset the AUTOINCREMENT counter so each test starts from id=1.
  // This couples teardown to SQLite internals; accepted pragmatism until
  // the service supports dependency injection for the DB.
  db.exec("DELETE FROM sqlite_sequence WHERE name = 'orders'");
});

describe("createOrder", () => {
  it("should create an order with auto-generated orderNumber and trayCode", () => {
    const order = ordersService.createOrder({
      customerName: "AlphaTech",
      productType: "Dental Crown",
      quantity: 10,
      notes: "Test batch",
    });

    expect(order.id).toBe(1);
    expect(order.orderNumber).toMatch(/^ORD-\d{4,}$/);
    expect(order.trayCode).toMatch(/^TRAY-\d{4,}$/);
    expect(order.customerName).toBe("AlphaTech");
    expect(order.productType).toBe("Dental Crown");
    expect(order.quantity).toBe(10);
    expect(order.notes).toBe("Test batch");
    expect(order.createdAt).toBeDefined();
  });

  it("should increment orderNumber and trayCode sequentially", () => {
    const first = ordersService.createOrder({
      customerName: "A",
      productType: "X",
      quantity: 1,
    });
    const second = ordersService.createOrder({
      customerName: "B",
      productType: "Y",
      quantity: 2,
    });

    expect(first.orderNumber).toBe("ORD-0001");
    expect(first.trayCode).toBe("TRAY-0001");
    expect(second.orderNumber).toBe("ORD-0002");
    expect(second.trayCode).toBe("TRAY-0002");
  });

  it("should default notes to empty string when omitted", () => {
    const order = ordersService.createOrder({
      customerName: "C",
      productType: "Z",
      quantity: 1,
    });
    expect(order.notes).toBe("");
  });
});

describe("getOrderById", () => {
  it("should return the order when it exists", () => {
    const created = ordersService.createOrder({
      customerName: "AlphaTech",
      productType: "Dental Crown",
      quantity: 5,
    });
    const found = ordersService.getOrderById(created.id);
    expect(found).toEqual(created);
  });

  it("should throw AppError 404 when order does not exist", () => {
    expect(() => ordersService.getOrderById(999)).toThrow(
      expect.objectContaining({ statusCode: 404 }),
    );
  });
});

describe("getOrderByTrayCode", () => {
  it("should return the order when tray code exists", () => {
    const created = ordersService.createOrder({
      customerName: "AlphaTech",
      productType: "Implant",
      quantity: 3,
    });
    const found = ordersService.getOrderByTrayCode(created.trayCode);
    expect(found).toEqual(created);
  });

  it("should throw AppError 404 when tray code does not exist", () => {
    expect(() => ordersService.getOrderByTrayCode("TRAY-9999")).toThrow(AppError);
  });
});

describe("listOrders", () => {
  it("should return empty array when no orders exist", () => {
    expect(ordersService.listOrders()).toEqual([]);
  });

  it("should return all orders in descending creation order", () => {
    ordersService.createOrder({ customerName: "A", productType: "X", quantity: 1 });
    ordersService.createOrder({ customerName: "B", productType: "Y", quantity: 2 });

    const orders = ordersService.listOrders();
    expect(orders).toHaveLength(2);
    expect(orders[0].customerName).toBe("B");
    expect(orders[1].customerName).toBe("A");
  });

  it("should respect limit", () => {
    for (let i = 1; i <= 5; i++) {
      ordersService.createOrder({ customerName: `C${i}`, productType: "X", quantity: i });
    }
    const orders = ordersService.listOrders({ limit: 3 });
    expect(orders).toHaveLength(3);
  });

  it("should respect offset", () => {
    ordersService.createOrder({ customerName: "First", productType: "X", quantity: 1 });
    ordersService.createOrder({ customerName: "Second", productType: "X", quantity: 1 });
    ordersService.createOrder({ customerName: "Third", productType: "X", quantity: 1 });

    const orders = ordersService.listOrders({ limit: 10, offset: 1 });
    expect(orders).toHaveLength(2);
    expect(orders[0].customerName).toBe("Second");
  });

  it("should return empty array when offset exceeds total count", () => {
    ordersService.createOrder({ customerName: "A", productType: "X", quantity: 1 });
    expect(ordersService.listOrders({ offset: 100 })).toEqual([]);
  });
});

describe("generateQrCode", () => {
  it("should return a PNG buffer for a valid order", async () => {
    const order = ordersService.createOrder({
      customerName: "AlphaTech",
      productType: "Dental Crown",
      quantity: 5,
    });
    const buffer = await ordersService.generateQrCode(order.id);
    expect(buffer).toBeInstanceOf(Buffer);
    expect(buffer.length).toBeGreaterThan(0);
    expect(buffer[0]).toBe(0x89); // PNG magic byte
    expect(buffer[1]).toBe(0x50); // 'P'
  });

  it("should throw AppError 404 when order does not exist", async () => {
    await expect(ordersService.generateQrCode(999)).rejects.toThrow(AppError);
  });
});

describe("generateQrDataUrl", () => {
  it("should return a data URL string for a valid order", async () => {
    const order = ordersService.createOrder({
      customerName: "AlphaTech",
      productType: "Implant",
      quantity: 3,
    });
    const dataUrl = await ordersService.generateQrDataUrl(order.id);
    expect(dataUrl).toMatch(/^data:image\/png;base64,/);
  });

  it("should throw AppError 404 when order does not exist", async () => {
    await expect(ordersService.generateQrDataUrl(999)).rejects.toThrow(AppError);
  });
});
