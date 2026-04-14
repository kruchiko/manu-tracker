import { describe, expect, it } from "vitest";
import { formatOrderLineCount } from "./customerOrderStatusLabels";

describe("formatOrderLineCount", () => {
  it("uses singular and plural labels", () => {
    expect(formatOrderLineCount(1)).toBe("1 line");
    expect(formatOrderLineCount(2)).toBe("2 lines");
    expect(formatOrderLineCount(0)).toBe("0 lines");
  });

  it("floors non-integers and guards invalid values", () => {
    expect(formatOrderLineCount(2.7)).toBe("2 lines");
    expect(formatOrderLineCount(Number.NaN)).toBe("0 lines");
    expect(formatOrderLineCount(-1)).toBe("0 lines");
  });
});
