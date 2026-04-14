import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { vi } from "vitest";
import { ScreenHeader } from "./ScreenHeader";

describe("ScreenHeader", () => {
  describe("layout=inline (default)", () => {
    it("renders back button, string title as h1, and actions", () => {
      render(
        <ScreenHeader
          backLabel="Stations"
          onBack={vi.fn()}
          title="New Station"
          actions={<button type="button">Save</button>}
        />,
      );

      expect(screen.getByRole("button", { name: "Back to Stations" })).toBeInTheDocument();
      expect(screen.getByRole("heading", { level: 1, name: "New Station" })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "Save" })).toBeInTheDocument();
    });

    it("wraps ReactNode title in a div with heading role", () => {
      render(
        <ScreenHeader
          backLabel="Jobs"
          onBack={vi.fn()}
          title={<><span>JOB-001</span> Widget</>}
        />,
      );

      const heading = screen.getByRole("heading", { level: 1 });
      expect(heading.tagName).toBe("DIV");
      expect(within(heading).getByText("JOB-001")).toBeInTheDocument();
    });

    it("calls onBack when back button is clicked", async () => {
      const user = userEvent.setup();
      const onBack = vi.fn();
      render(<ScreenHeader backLabel="Jobs" onBack={onBack} title="Detail" />);

      await user.click(screen.getByRole("button", { name: "Back to Jobs" }));
      expect(onBack).toHaveBeenCalledTimes(1);
    });

    it("omits actions container when actions is undefined", () => {
      const { container } = render(
        <ScreenHeader backLabel="Jobs" onBack={vi.fn()} title="Test" />,
      );
      expect(container.querySelector("[class*=actions]")).toBeNull();
    });
  });

  describe("layout=stack", () => {
    it("renders meta line above the title", () => {
      render(
        <ScreenHeader
          layout="stack"
          backLabel="Jobs"
          onBack={vi.fn()}
          meta={<>JOB-42 · TRAY-42</>}
          title="Type B"
          actions={<button type="button">Print</button>}
        />,
      );

      expect(screen.getByText(/JOB-42/)).toBeInTheDocument();
      expect(screen.getByRole("heading", { level: 1, name: "Type B" })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "Print" })).toBeInTheDocument();
    });
  });

  describe('layout=detailToolbar + variant=detailBand', () => {
    it("renders tinted band with title content and actions", () => {
      const { container } = render(
        <ScreenHeader
          layout="detailToolbar"
          variant="detailBand"
          backLabel="Jobs"
          onBack={vi.fn()}
          title={<><span>JOB-001</span><h1>Widget</h1></>}
          actions={<button type="button">Print Label</button>}
        />,
      );

      expect(screen.getByText("JOB-001")).toBeInTheDocument();
      expect(screen.getByText("Widget")).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "Print Label" })).toBeInTheDocument();
      expect(container.querySelector("[class*=shellDetailBand]")).toBeInTheDocument();
    });
  });

  describe("variant=hero", () => {
    it("renders dark hero with meta and h1 title", () => {
      const { container } = render(
        <ScreenHeader
          variant="hero"
          backLabel="Back"
          backAriaLabel="Back to customer orders"
          onBack={vi.fn()}
          meta={<>CO-0001 · CREATED 14 APR 2026</>}
          title="Acme Group"
        >
          <span data-testid="status-row">Open</span>
        </ScreenHeader>,
      );

      expect(screen.getByRole("button", { name: "Back to customer orders" })).toBeInTheDocument();
      expect(screen.getByText(/CO-0001/)).toBeInTheDocument();
      expect(screen.getByRole("heading", { level: 1, name: "Acme Group" })).toBeInTheDocument();
      expect(screen.getByTestId("status-row")).toBeInTheDocument();
      expect(container.querySelector("[class*=shellHero]")).toBeInTheDocument();
    });

    it("renders two-column grid when heroTopAside is provided", () => {
      const { container } = render(
        <ScreenHeader
          variant="hero"
          backLabel="Back"
          backAriaLabel="Back to customer orders"
          onBack={vi.fn()}
          meta={<>CO-0001</>}
          title="Acme Group"
          heroTopAside={<div data-testid="kpi-strip">3 Jobs</div>}
        >
          <span>Open</span>
        </ScreenHeader>,
      );

      expect(screen.getByTestId("kpi-strip")).toBeInTheDocument();
      expect(container.querySelector("[class*=heroGrid]")).toBeInTheDocument();
      expect(container.querySelector("[class*=heroMain]")).toBeInTheDocument();
      expect(container.querySelector("[class*=heroAside]")).toBeInTheDocument();
    });

    it("does not render heroGrid when heroTopAside is omitted", () => {
      const { container } = render(
        <ScreenHeader
          variant="hero"
          backLabel="Back"
          onBack={vi.fn()}
          title="Simple hero"
        />,
      );

      expect(container.querySelector("[class*=heroGrid]")).toBeNull();
    });
  });

  describe("className pass-through", () => {
    it("merges custom className onto the header element", () => {
      const { container } = render(
        <ScreenHeader
          backLabel="Jobs"
          onBack={vi.fn()}
          title="Test"
          className="my-custom-class"
        />,
      );

      expect(container.querySelector("header")?.classList.contains("my-custom-class")).toBe(true);
    });
  });
});
