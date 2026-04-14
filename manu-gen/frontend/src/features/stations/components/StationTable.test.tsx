import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { vi } from "vitest";
import { createWrapper } from "../../../test-utils";
import { StationTable } from "./StationTable";
import type { Station } from "../stations.types";

vi.mock("../hooks/useDeleteStation", () => ({ useDeleteStation: vi.fn() }));

import { useDeleteStation } from "../hooks/useDeleteStation";

const stations: Station[] = [
  { id: "station-aaa", name: "Polishing", location: "Floor 2", eyeId: "eye-1", slotCapacity: 3 },
  { id: "station-bbb", name: "Casting", location: "", eyeId: null },
];

function mockDeleteHook(overrides?: Partial<ReturnType<typeof useDeleteStation>>) {
  vi.mocked(useDeleteStation).mockReturnValue({
    mutate: vi.fn(),
    isPending: false,
    error: null,
    ...overrides,
  } as unknown as ReturnType<typeof useDeleteStation>);
}

describe("StationTable", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("should render station names and locations", () => {
    mockDeleteHook();
    render(<StationTable stations={stations} />, { wrapper: createWrapper() });

    expect(screen.getByText("Polishing")).toBeInTheDocument();
    expect(screen.getByText("Floor 2")).toBeInTheDocument();
    expect(screen.getByText("Casting")).toBeInTheDocument();
  });

  it("should show camera badge when eye is assigned", () => {
    mockDeleteHook();
    render(<StationTable stations={stations} />, { wrapper: createWrapper() });

    expect(screen.getByText("eye-1")).toBeInTheDocument();
  });

  it("should show 'No camera' when eye is not assigned", () => {
    mockDeleteHook();
    render(<StationTable stations={stations} />, { wrapper: createWrapper() });

    expect(screen.getByText("No camera")).toBeInTheDocument();
  });

  it("should render slot capacity from station data", () => {
    mockDeleteHook();
    render(<StationTable stations={stations} />, { wrapper: createWrapper() });

    expect(screen.getByText("3 slots")).toBeInTheDocument();
    expect(screen.getByText("1 slot")).toBeInTheDocument();
  });

  it("should require confirmation before deleting", async () => {
    const mutate = vi.fn();
    mockDeleteHook({ mutate });

    const user = userEvent.setup();
    render(<StationTable stations={stations} />, { wrapper: createWrapper() });

    await user.click(
      screen.getByRole("button", { name: "Delete station Polishing" }),
    );

    expect(mutate).not.toHaveBeenCalled();
    expect(screen.getByRole("button", { name: "Confirm" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Cancel" })).toBeInTheDocument();
  });

  it("should call deleteStation.mutate on confirm", async () => {
    const mutate = vi.fn();
    mockDeleteHook({ mutate });

    const user = userEvent.setup();
    render(<StationTable stations={stations} />, { wrapper: createWrapper() });

    await user.click(
      screen.getByRole("button", { name: "Delete station Polishing" }),
    );
    await user.click(screen.getByRole("button", { name: "Confirm" }));

    expect(mutate).toHaveBeenCalledWith("station-aaa", expect.any(Object));
  });

  it("should show em dash for missing location", () => {
    mockDeleteHook();
    render(<StationTable stations={stations} />, { wrapper: createWrapper() });

    expect(screen.getByText("\u2014")).toBeInTheDocument();
  });

  it("should display error message when delete fails", async () => {
    const mutate = vi.fn().mockImplementation((_id, options) => {
      options.onError(new Error("Used in 1 pipeline step(s)"));
    });
    mockDeleteHook({ mutate });

    const user = userEvent.setup();
    render(<StationTable stations={stations} />, { wrapper: createWrapper() });

    await user.click(
      screen.getByRole("button", { name: "Delete station Polishing" }),
    );
    await user.click(screen.getByRole("button", { name: "Confirm" }));

    expect(screen.getByText("Used in 1 pipeline step(s)")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "OK" })).toBeInTheDocument();
  });

  it("should call onSelectStation when a row is clicked", async () => {
    const onSelectStation = vi.fn();
    mockDeleteHook();

    const user = userEvent.setup();
    render(
      <StationTable stations={stations} onSelectStation={onSelectStation} />,
      { wrapper: createWrapper() },
    );

    await user.click(screen.getByText("Polishing"));

    expect(onSelectStation).toHaveBeenCalledWith(stations[0]);
  });

  it("should dismiss error when OK is clicked", async () => {
    const mutate = vi.fn().mockImplementation((_id, options) => {
      options.onError(new Error("Cannot delete"));
    });
    mockDeleteHook({ mutate });

    const user = userEvent.setup();
    render(<StationTable stations={stations} />, { wrapper: createWrapper() });

    await user.click(
      screen.getByRole("button", { name: "Delete station Polishing" }),
    );
    await user.click(screen.getByRole("button", { name: "Confirm" }));
    await user.click(screen.getByRole("button", { name: "OK" }));

    expect(screen.queryByText("Cannot delete")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Delete station Polishing" })).toBeInTheDocument();
  });
});
