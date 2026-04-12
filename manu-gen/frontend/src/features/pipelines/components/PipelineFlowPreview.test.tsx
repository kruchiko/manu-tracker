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
    maxDurationSeconds: null,
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
        maxDurationSeconds: 3600,
        maxCapacity: 4,
      },
    ];
    render(<PipelineFlowPreview steps={steps} />);

    expect(screen.getByText("max 60 min")).toBeInTheDocument();
    expect(screen.getByText("max 4/tray")).toBeInTheDocument();
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
