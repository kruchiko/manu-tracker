import { render, screen } from "@testing-library/react";
import { vi } from "vitest";
import { createWrapper } from "../../../test-utils";
import { StationList } from "./StationList";
import type { Station } from "../stations.types";

vi.mock("../hooks/useStations", () => ({ useStations: vi.fn() }));

import { useStations } from "../hooks/useStations";

const sampleStations: Station[] = [
  { id: "station-aaa", name: "Polishing", location: "Floor 2", eyeId: "eye-1" },
  { id: "station-bbb", name: "Casting", location: "", eyeId: null },
];

describe("StationList", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("should show loading state", () => {
    vi.mocked(useStations).mockReturnValue({
      isLoading: true,
      error: null,
      data: undefined,
    } as unknown as ReturnType<typeof useStations>);

    render(<StationList />, { wrapper: createWrapper() });

    expect(screen.getByText("Loading stations...")).toBeInTheDocument();
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
      screen.getByText("No stations yet. Create one above."),
    ).toBeInTheDocument();
  });

  it("should render station cards", () => {
    vi.mocked(useStations).mockReturnValue({
      isLoading: false,
      error: null,
      data: sampleStations,
    } as unknown as ReturnType<typeof useStations>);

    render(<StationList />, { wrapper: createWrapper() });

    expect(screen.getByText("Polishing")).toBeInTheDocument();
    expect(screen.getByText("Floor 2")).toBeInTheDocument();
    expect(screen.getByText("Casting")).toBeInTheDocument();
  });
});
