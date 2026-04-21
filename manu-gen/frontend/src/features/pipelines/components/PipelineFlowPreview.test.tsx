import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { vi } from "vitest";
import { PIPELINE_FLOW_LAYOUT, calcMaxVisible } from "./pipelineFlowLayout";
import { PipelineFlowPreview } from "./PipelineFlowPreview";
import type { PipelineStep } from "../pipelines.types";

function makeSteps(count: number): PipelineStep[] {
  return Array.from({ length: count }, (_, i) => ({
    id: i + 1,
    stationId: `station-${i}`,
    stationName: `Step ${i + 1}`,
    position: i + 1,
    minDurationSeconds: null,
    maxDurationSeconds: null,
    minCapacity: null,
    maxCapacity: null,
  }));
}

describe("calcMaxVisible", () => {
  it("returns totalSteps when the full flow fits", () => {
    expect(calcMaxVisible(800, 3)).toBe(3);
  });

  it("returns 1 when available width is tiny", () => {
    expect(calcMaxVisible(50, 5)).toBe(1);
  });

  it("truncates correctly for a given width", () => {
    const { stepColumnWidthPx, connectorWidthPx, moreTailReservePx } = PIPELINE_FLOW_LAYOUT;
    const fiveFull =
      stepColumnWidthPx * 5 + connectorWidthPx * Math.max(0, 5 - 1);
    expect(fiveFull).toBe(481);
    expect(calcMaxVisible(500, 5)).toBe(5);
    // 481 > 400 → truncated: floor((400 - moreTailReservePx) / (step + connector))
    expect(calcMaxVisible(400, 5)).toBe(3);
    expect(
      Math.floor((400 - moreTailReservePx) / (stepColumnWidthPx + connectorWidthPx)),
    ).toBe(3);
  });

  it("shows all when exactly enough space", () => {
    const { stepColumnWidthPx, connectorWidthPx } = PIPELINE_FLOW_LAYOUT;
    const threeFull = stepColumnWidthPx * 3 + connectorWidthPx * 2;
    expect(threeFull).toBe(279);
    expect(calcMaxVisible(279, 3)).toBe(3);
  });

  it("never returns more than totalSteps", () => {
    expect(calcMaxVisible(9999, 2)).toBe(2);
  });

  it("returns 1 for zero or negative width", () => {
    expect(calcMaxVisible(0, 5)).toBe(1);
    expect(calcMaxVisible(-100, 3)).toBe(1);
  });
});

describe("PipelineFlowPreview", () => {
  it("should render station names for each visible step", () => {
    const steps = makeSteps(2);
    render(<PipelineFlowPreview steps={steps} />);

    expect(screen.getByText("Step 1")).toBeInTheDocument();
    expect(screen.getByText("Step 2")).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /more/ }),
    ).not.toBeInTheDocument();
  });

  it("should show duration and capacity lines when set", () => {
    const steps: PipelineStep[] = [
      {
        id: 1,
        stationId: "s1",
        stationName: "Cut",
        position: 1,
        minDurationSeconds: null,
        maxDurationSeconds: 3600,
        minCapacity: null,
        maxCapacity: 4,
      },
    ];
    render(<PipelineFlowPreview steps={steps} />);

    expect(screen.getByText("max 60 min")).toBeInTheDocument();
    expect(screen.getByText("max 4/tray")).toBeInTheDocument();
  });

  it("should show duration and capacity ranges when min and max are set", () => {
    const steps: PipelineStep[] = [
      {
        id: 1,
        stationId: "s1",
        stationName: "Cut",
        position: 1,
        minDurationSeconds: 3600,
        maxDurationSeconds: 7200,
        minCapacity: 2,
        maxCapacity: 6,
      },
    ];
    render(<PipelineFlowPreview steps={steps} />);

    expect(screen.getByText("60–120 min")).toBeInTheDocument();
    expect(screen.getByText("2–6/tray")).toBeInTheDocument();
  });

  it("should show max-only labels when min fields are undefined (e.g. older API payloads)", () => {
    const steps = [
      {
        id: 1,
        stationId: "s1",
        stationName: "Inspection",
        position: 1,
        maxDurationSeconds: 300,
        maxCapacity: 15,
      },
    ] as unknown as PipelineStep[];

    render(<PipelineFlowPreview steps={steps} />);

    expect(screen.getByText("max 5 min")).toBeInTheDocument();
    expect(screen.getByText("max 15/tray")).toBeInTheDocument();
    expect(screen.queryByText(/NaN/)).not.toBeInTheDocument();
    expect(screen.queryByText(/undefined/)).not.toBeInTheDocument();
  });

  it("should not show +N more when a single step fits the preview", () => {
    render(<PipelineFlowPreview steps={makeSteps(1)} />);

    expect(screen.getByText("Step 1")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /more/ })).not.toBeInTheDocument();
  });

  it("should render all steps in jsdom (zero-width container shows all)", () => {
    const steps = makeSteps(8);
    render(<PipelineFlowPreview steps={steps} />);

    for (let i = 1; i <= 8; i++) {
      expect(screen.getByText(`Step ${i}`)).toBeInTheDocument();
    }
    expect(
      screen.queryByRole("button", { name: /more/ }),
    ).not.toBeInTheDocument();
  });
});

describe("PipelineFlowPreview truncation (ResizeObserver)", () => {
  const savedResizeObserver = globalThis.ResizeObserver;
  const originalGetBoundingClientRect = HTMLElement.prototype.getBoundingClientRect;

  beforeEach(() => {
    globalThis.ResizeObserver = class TestResizeObserver {
      private readonly callback: ResizeObserverCallback;

      constructor(callback: ResizeObserverCallback) {
        this.callback = callback;
      }

      observe(): void {
        queueMicrotask(() => {
          this.callback([], this as unknown as ResizeObserver);
        });
      }

      unobserve(): void {}

      disconnect(): void {}
    } as unknown as typeof ResizeObserver;
  });

  afterEach(() => {
    globalThis.ResizeObserver = savedResizeObserver;
    vi.restoreAllMocks();
  });

  it("shows +N more and calls onMore when the flow root reports a constrained width", async () => {
    const constrainedWidth = 250;
    vi.spyOn(HTMLElement.prototype, "getBoundingClientRect").mockImplementation(function (
      this: HTMLElement,
    ) {
      if (this.getAttribute("data-testid") === "pipeline-flow-root") {
        return {
          width: constrainedWidth,
          height: 40,
          top: 0,
          left: 0,
          bottom: 40,
          right: constrainedWidth,
          x: 0,
          y: 0,
          toJSON: () => ({}),
        } as DOMRect;
      }
      return originalGetBoundingClientRect.call(this);
    });

    const steps = makeSteps(5);
    const hidden = steps.length - calcMaxVisible(constrainedWidth, steps.length);
    expect(hidden).toBe(4);

    const onMore = vi.fn();
    const user = userEvent.setup();
    render(<PipelineFlowPreview steps={steps} onMore={onMore} />);

    await waitFor(() => {
      expect(screen.getByRole("button", { name: `+${hidden} more` })).toBeInTheDocument();
    });
    expect(screen.queryByText("Step 2")).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: `+${hidden} more` }));
    expect(onMore).toHaveBeenCalledTimes(1);
  });
});
