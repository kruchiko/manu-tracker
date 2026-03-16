import { describe, it, expect, beforeEach } from "vitest";
import db from "../../db.js";
import { AppError } from "../../shared/errors/app-error.js";
import * as ordersService from "./orders.service.js";

beforeEach(() => {
  db.exec("DELETE FROM orders");
  db.exec("DELETE FROM sqlite_sequence WHERE name = 'orders'");
});

describe("createOrder", () => {
  it("should create an order with auto-generated order_number and tray_code", () => {
    const order = ordersService.createOrder({
      customer_name: "AlphaTech",
      product_type: "Dental Crown",
      quantity: 10,
      notes: "Test batch",
    });

    expect(order.id).toBe(1);
    expect(order.order_number).toMatch(/^ORD-\d{4,}$/);
    expect(order.tray_code).toMatch(/^TRAY-\d{4,}$/);
    expect(order.customer_name).toBe("AlphaTech");
    expect(order.product_type).toBe("Dental Crown");
    expect(order.quantity).toBe(10);
    expect(order.notes).toBe("Test batch");
    expect(order.created_at).toBeDefined();
  });

  it("should increment order_number and tray_code sequentially", () => {
    const first = ordersService.createOrder({
      customer_name: "A",
      product_type: "X",
      quantity: 1,
    });
    const second = ordersService.createOrder({
      customer_name: "B",
      product_type: "Y",
      quantity: 2,
    });

    expect(first.order_number).toBe("ORD-0001");
    expect(first.tray_code).toBe("TRAY-0001");
    expect(second.order_number).toBe("ORD-0002");
    expect(second.tray_code).toBe("TRAY-0002");
  });

  it("should default notes to empty string when omitted", () => {
    const order = ordersService.createOrder({
      customer_name: "C",
      product_type: "Z",
      quantity: 1,
    });
    expect(order.notes).toBe("");
  });
});

describe("getOrderById", () => {
  it("should return the order when it exists", () => {
    const created = ordersService.createOrder({
      customer_name: "AlphaTech",
      product_type: "Dental Crown",
      quantity: 5,
    });
    const found = ordersService.getOrderById(created.id);
    expect(found).toEqual(created);
  });

  it("should throw AppError 404 when order does not exist", () => {
    expect(() => ordersService.getOrderById(999)).toThrow(AppError);
    try {
      ordersService.getOrderById(999);
    } catch (err) {
      expect(err).toBeInstanceOf(AppError);
      expect((err as AppError).statusCode).toBe(404);
    }
  });
});

describe("getOrderByTrayCode", () => {
  it("should return the order when tray code exists", () => {
    const created = ordersService.createOrder({
      customer_name: "AlphaTech",
      product_type: "Implant",
      quantity: 3,
    });
    const found = ordersService.getOrderByTrayCode(created.tray_code);
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
    ordersService.createOrder({ customer_name: "A", product_type: "X", quantity: 1 });
    ordersService.createOrder({ customer_name: "B", product_type: "Y", quantity: 2 });

    const orders = ordersService.listOrders();
    expect(orders).toHaveLength(2);
    expect(orders[0].customer_name).toBe("B");
    expect(orders[1].customer_name).toBe("A");
  });
});

describe("generateQrCode", () => {
  it("should return a PNG buffer for a valid order", async () => {
    const order = ordersService.createOrder({
      customer_name: "AlphaTech",
      product_type: "Dental Crown",
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
      customer_name: "AlphaTech",
      product_type: "Implant",
      quantity: 3,
    });
    const dataUrl = await ordersService.generateQrDataUrl(order.id);
    expect(dataUrl).toMatch(/^data:image\/png;base64,/);
  });

  it("should throw AppError 404 when order does not exist", async () => {
    await expect(ordersService.generateQrDataUrl(999)).rejects.toThrow(AppError);
  });
});
