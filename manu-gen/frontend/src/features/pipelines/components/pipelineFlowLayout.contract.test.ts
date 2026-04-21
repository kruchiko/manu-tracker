import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { PIPELINE_FLOW_LAYOUT, calcMaxVisible } from "./pipelineFlowLayout";

const tokensPath = join(dirname(fileURLToPath(import.meta.url)), "../../../tokens/design-tokens.css");
const tokensCss = readFileSync(tokensPath, "utf8");

describe("pipeline flow layout vs design tokens", () => {
  it("still declares the step width and connector gap this truncation math assumes", () => {
    expect(tokensCss).toMatch(/--pipeline-flow-step-width:\s*77px/);
    expect(tokensCss).toMatch(/--space-6:\s*24px/);
  });

  it("reserves the same horizontal budget as --pipeline-flow-more-tail-min in tokens", () => {
    expect(tokensCss).toMatch(/--pipeline-flow-more-tail-min:\s*94px/);
    expect(PIPELINE_FLOW_LAYOUT.moreTailReservePx).toBe(94);
  });

  it("keeps literals documented for Playwright / design reviews", () => {
    expect(PIPELINE_FLOW_LAYOUT.stepColumnWidthPx).toBe(77);
    expect(PIPELINE_FLOW_LAYOUT.connectorWidthPx).toBe(24);
  });

  it("fits all three steps at exact pixel width, and one pixel less triggers truncation math", () => {
    const w =
      PIPELINE_FLOW_LAYOUT.stepColumnWidthPx * 3 + PIPELINE_FLOW_LAYOUT.connectorWidthPx * 2;
    expect(calcMaxVisible(w, 3)).toBe(3);
    // Below “all fit”: reserve `moreTailReservePx` first — for three steps this lands at 1 visible, not 2.
    expect(calcMaxVisible(w - 1, 3)).toBe(1);
  });
});
