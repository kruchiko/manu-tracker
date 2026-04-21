import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { vi } from "vitest";
import { calcMaxVisible } from "./pipelineFlowLayout";
import { PipelineFlowPreview } from "./PipelineFlowPreview";
import type { PipelineStep } from "../pipelines.types";

const defaultInnerWidth = window.innerWidth;

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
  it("returns totalSteps when the full flow fits in the flow column", () => {
    expect(calcMaxVisible(2000, 3)).toBe(3);
  });

  it("returns 1 when horizontal space for the flow column is exhausted", () => {
    expect(calcMaxVisible(600, 5)).toBe(1);
  });

  it("truncates at 1024px viewport for five steps (matches list layout constants)", () => {
    expect(calcMaxVisible(1024, 5)).toBe(2);
  });
});

describe("PipelineFlowPreview", () => {
  beforeEach(() => {
    Object.defineProperty(window, "innerWidth", {
      configurable: true,
      writable: true,
      value: 1024,
    });
  });

  afterEach(() => {
    Object.defineProperty(window, "innerWidth", {
      configurable: true,
      writable: true,
      value: defaultInnerWidth,
    });
  });

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

  it("should recalc visible steps when step count grows without a window resize", () => {
    const hiddenAt1024 = 5 - calcMaxVisible(1024, 5);
    const { rerender } = render(<PipelineFlowPreview steps={makeSteps(1)} />);

    expect(screen.queryByRole("button", { name: /more/ })).not.toBeInTheDocument();

    rerender(<PipelineFlowPreview steps={makeSteps(5)} />);

    expect(screen.getByText("Step 2")).toBeInTheDocument();
    expect(screen.queryByText("Step 3")).not.toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: `+${hiddenAt1024} more` }),
    ).toBeInTheDocument();
  });

  it("should truncate with +N more and invoke onMore when clicked", async () => {
    const user = userEvent.setup();
    const onMore = vi.fn();
    const steps = makeSteps(5);
    const hidden = steps.length - calcMaxVisible(1024, steps.length);

    render(<PipelineFlowPreview steps={steps} onMore={onMore} />);

    const moreBtn = screen.getByRole("button", {
      name: `+${hidden} more`,
    });
    expect(moreBtn).toBeInTheDocument();

    await user.click(moreBtn);
    expect(onMore).toHaveBeenCalledTimes(1);
  });
});
