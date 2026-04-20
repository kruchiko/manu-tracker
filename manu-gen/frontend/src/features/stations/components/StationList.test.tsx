import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { vi } from "vitest";
import { createWrapper } from "../../../test-utils";
import { StationList } from "./StationList";
import type { Station } from "../stations.types";

vi.mock("../hooks/useStations", () => ({ useStations: vi.fn() }));
vi.mock("../hooks/useDeleteStation", () => ({
  useDeleteStation: vi.fn(() => ({
    mutate: vi.fn(),
    isPending: false,
    error: null,
  })),
}));

import { useStations } from "../hooks/useStations";
import { useDeleteStation } from "../hooks/useDeleteStation";

const sampleStations: Station[] = [
  { id: "station-aaa", name: "Polishing", location: "Floor 2", eyeId: "eye-1", slotCapacity: 1 },
  { id: "station-bbb", name: "Casting", location: "", eyeId: null, slotCapacity: 1 },
];

describe("StationList", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("should show loading skeleton", () => {
    vi.mocked(useStations).mockReturnValue({
      isLoading: true,
      error: null,
      data: undefined,
    } as unknown as ReturnType<typeof useStations>);

    const { container } = render(<StationList />, { wrapper: createWrapper() });

    expect(screen.queryByText("All Stations")).not.toBeInTheDocument();
    expect(screen.queryByText("No stations yet.")).not.toBeInTheDocument();
    expect(container.firstElementChild).toBeInTheDocument();
  });

  it("should show error message when fetch fails", () => {
    vi.mocked(useStations).mockReturnValue({
      isLoading: false,
      error: new Error("Network error"),
      data: undefined,
    } as unknown as ReturnType<typeof useStations>);

    render(<StationList />, { wrapper: createWrapper() });

    expect(screen.getByText(/Network error/)).toBeInTheDocument();
  });

  it("should show empty state when there are no stations", () => {
    vi.mocked(useStations).mockReturnValue({
      isLoading: false,
      error: null,
      data: [],
    } as unknown as ReturnType<typeof useStations>);

    render(<StationList />, { wrapper: createWrapper() });

    expect(
      screen.getByText("No stations yet. Create one to get started."),
    ).toBeInTheDocument();
  });

  it("should render stations in a data table", () => {
    vi.mocked(useStations).mockReturnValue({
      isLoading: false,
      error: null,
      data: sampleStations,
    } as unknown as ReturnType<typeof useStations>);

    render(<StationList />, { wrapper: createWrapper() });

    expect(screen.getByText("All Stations")).toBeInTheDocument();
    expect(screen.getByText("2 stations")).toBeInTheDocument();

    expect(screen.getByText("Polishing")).toBeInTheDocument();
    expect(screen.getByText("Floor 2")).toBeInTheDocument();
    expect(screen.getByText("eye-1")).toBeInTheDocument();

    expect(screen.getByText("Casting")).toBeInTheDocument();
    expect(screen.getByText("No camera")).toBeInTheDocument();
  });

  it("should render table column headers", () => {
    vi.mocked(useStations).mockReturnValue({
      isLoading: false,
      error: null,
      data: sampleStations,
    } as unknown as ReturnType<typeof useStations>);

    render(<StationList />, { wrapper: createWrapper() });

    expect(screen.getByText("Station")).toBeInTheDocument();
    expect(screen.getByText("Location")).toBeInTheDocument();
    expect(screen.getByText("Slot capacity")).toBeInTheDocument();
    expect(screen.getByText("Camera")).toBeInTheDocument();
    expect(screen.getByText("Actions")).toBeInTheDocument();
  });

  it("should show delete failure in a top alert with Dismiss, not in the table row", async () => {
    const mutate = vi.fn().mockImplementation((_id, options) => {
      options.onError(new Error("Cannot delete station: used in pipeline step(s)"));
    });
    vi.mocked(useDeleteStation).mockReturnValue({
      mutate,
      isPending: false,
      error: null,
    } as unknown as ReturnType<typeof useDeleteStation>);

    vi.mocked(useStations).mockReturnValue({
      isLoading: false,
      error: null,
      data: [sampleStations[0]],
    } as unknown as ReturnType<typeof useStations>);

    const user = userEvent.setup();
    render(<StationList />, { wrapper: createWrapper() });

    await user.click(screen.getByRole("button", { name: "Delete station Polishing" }));
    await user.click(screen.getByRole("button", { name: "Confirm" }));

    const alert = screen.getByRole("alert");
    expect(alert).toHaveTextContent("Cannot delete station: used in pipeline step(s)");

    expect(screen.getByRole("button", { name: "Delete station Polishing" })).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Dismiss notification" }));

    await waitFor(() => {
      expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    });
  });
});
