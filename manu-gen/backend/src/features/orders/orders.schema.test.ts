import { describe, it, expect } from "vitest";
import { createOrderSchema } from "./orders.schema.js";

describe("createOrderSchema", () => {
  const validInput = {
    customerName: "AlphaTech",
    productType: "Dental Crown",
    quantity: 12,
    notes: "Urgent batch",
    pipelineId: "pipeline-abc",
  };

  it("should accept valid input with all fields", () => {
    const result = createOrderSchema.parse(validInput);
    expect(result.customerName).toBe("AlphaTech");
    expect(result.productType).toBe("Dental Crown");
    expect(result.quantity).toBe(12);
    expect(result.notes).toBe("Urgent batch");
    expect(result.pipelineId).toBe("pipeline-abc");
  });

  it("should accept valid input without optional notes", () => {
    const result = createOrderSchema.parse({
      customerName: "BetaMed",
      productType: "Surgical Implant",
      quantity: 5,
      pipelineId: "pipeline-abc",
    });
    expect(result.notes).toBe("");
  });

  it("should reject when pipelineId is missing", () => {
    expect(() =>
      createOrderSchema.parse({ customerName: "AlphaTech", productType: "Dental Crown", quantity: 1 }),
    ).toThrow();
  });

  it("should reject when customerName is empty", () => {
    expect(() =>
      createOrderSchema.parse({ ...validInput, customerName: "" }),
    ).toThrow();
  });

  it("should reject when productType is missing", () => {
    expect(() =>
      createOrderSchema.parse({ customerName: "AlphaTech", quantity: 1, pipelineId: "pipeline-abc" }),
    ).toThrow();
  });

  it("should reject when quantity is zero", () => {
    expect(() =>
      createOrderSchema.parse({ ...validInput, quantity: 0 }),
    ).toThrow();
  });

  it("should reject when quantity is negative", () => {
    expect(() =>
      createOrderSchema.parse({ ...validInput, quantity: -3 }),
    ).toThrow();
  });

  it("should reject when quantity is not an integer", () => {
    expect(() =>
      createOrderSchema.parse({ ...validInput, quantity: 2.5 }),
    ).toThrow();
  });
});
