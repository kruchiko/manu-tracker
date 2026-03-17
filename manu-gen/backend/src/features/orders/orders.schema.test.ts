import { describe, it, expect } from "vitest";
import { createOrderSchema } from "./orders.schema.js";

describe("createOrderSchema", () => {
  it("should accept valid input with all fields", () => {
    const result = createOrderSchema.parse({
      customerName: "AlphaTech",
      productType: "Dental Crown",
      quantity: 12,
      notes: "Urgent batch",
    });
    expect(result.customerName).toBe("AlphaTech");
    expect(result.productType).toBe("Dental Crown");
    expect(result.quantity).toBe(12);
    expect(result.notes).toBe("Urgent batch");
  });

  it("should accept valid input without optional notes", () => {
    const result = createOrderSchema.parse({
      customerName: "BetaMed",
      productType: "Surgical Implant",
      quantity: 5,
    });
    expect(result.notes).toBe("");
  });

  it("should reject when customerName is empty", () => {
    expect(() =>
      createOrderSchema.parse({ customerName: "", productType: "Dental Crown", quantity: 1 }),
    ).toThrow();
  });

  it("should reject when productType is missing", () => {
    expect(() =>
      createOrderSchema.parse({ customerName: "AlphaTech", quantity: 1 }),
    ).toThrow();
  });

  it("should reject when quantity is zero", () => {
    expect(() =>
      createOrderSchema.parse({ customerName: "AlphaTech", productType: "Dental Crown", quantity: 0 }),
    ).toThrow();
  });

  it("should reject when quantity is negative", () => {
    expect(() =>
      createOrderSchema.parse({ customerName: "AlphaTech", productType: "Dental Crown", quantity: -3 }),
    ).toThrow();
  });

  it("should reject when quantity is not an integer", () => {
    expect(() =>
      createOrderSchema.parse({ customerName: "AlphaTech", productType: "Dental Crown", quantity: 2.5 }),
    ).toThrow();
  });
});
