import { describe, it, expect } from "vitest";
import { createOrderSchema } from "./orders.schema.js";

describe("createOrderSchema", () => {
  it("should accept valid input with all fields", () => {
    const input = {
      customer_name: "AlphaTech",
      product_type: "Dental Crown",
      quantity: 12,
      notes: "Urgent batch",
    };
    const result = createOrderSchema.parse(input);
    expect(result.customer_name).toBe("AlphaTech");
    expect(result.product_type).toBe("Dental Crown");
    expect(result.quantity).toBe(12);
    expect(result.notes).toBe("Urgent batch");
  });

  it("should accept valid input without optional notes", () => {
    const input = {
      customer_name: "BetaMed",
      product_type: "Surgical Implant",
      quantity: 5,
    };
    const result = createOrderSchema.parse(input);
    expect(result.notes).toBe("");
  });

  it("should reject when customer_name is empty", () => {
    const input = {
      customer_name: "",
      product_type: "Dental Crown",
      quantity: 1,
    };
    expect(() => createOrderSchema.parse(input)).toThrow();
  });

  it("should reject when product_type is missing", () => {
    const input = {
      customer_name: "AlphaTech",
      quantity: 1,
    };
    expect(() => createOrderSchema.parse(input)).toThrow();
  });

  it("should reject when quantity is zero", () => {
    const input = {
      customer_name: "AlphaTech",
      product_type: "Dental Crown",
      quantity: 0,
    };
    expect(() => createOrderSchema.parse(input)).toThrow();
  });

  it("should reject when quantity is negative", () => {
    const input = {
      customer_name: "AlphaTech",
      product_type: "Dental Crown",
      quantity: -3,
    };
    expect(() => createOrderSchema.parse(input)).toThrow();
  });

  it("should reject when quantity is not an integer", () => {
    const input = {
      customer_name: "AlphaTech",
      product_type: "Dental Crown",
      quantity: 2.5,
    };
    expect(() => createOrderSchema.parse(input)).toThrow();
  });
});
