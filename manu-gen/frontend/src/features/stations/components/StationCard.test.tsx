import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { vi } from "vitest";
import { createWrapper } from "../../../test-utils";
import { StationCard } from "./StationCard";
import type { Station } from "../stations.types";

vi.mock("../hooks/useAssignEye", () => ({ useAssignEye: vi.fn() }));
vi.mock("../hooks/useUnassignEye", () => ({ useUnassignEye: vi.fn() }));
vi.mock("../hooks/useDeleteStation", () => ({ useDeleteStation: vi.fn() }));

import { useAssignEye } from "../hooks/useAssignEye";
import { useUnassignEye } from "../hooks/useUnassignEye";
import { useDeleteStation } from "../hooks/useDeleteStation";

const unassignedStation: Station = {
  id: "station-aaa",
  name: "Polishing",
  location: "Floor 2",
  eyeId: null,
  maxDurationSeconds: null,
};

const assignedStation: Station = {
  id: "station-bbb",
  name: "Casting",
  location: "Floor 1",
  eyeId: "eye-1",
  maxDurationSeconds: null,
};

function mockHooks(overrides?: {
  assignEye?: Partial<ReturnType<typeof useAssignEye>>;
  unassignEye?: Partial<ReturnType<typeof useUnassignEye>>;
  deleteStation?: Partial<ReturnType<typeof useDeleteStation>>;
}) {
  vi.mocked(useAssignEye).mockReturnValue({
    mutate: vi.fn(),
    isPending: false,
    error: null,
    ...overrides?.assignEye,
  } as unknown as ReturnType<typeof useAssignEye>);

  vi.mocked(useUnassignEye).mockReturnValue({
    mutate: vi.fn(),
    isPending: false,
    error: null,
    ...overrides?.unassignEye,
  } as unknown as ReturnType<typeof useUnassignEye>);

  vi.mocked(useDeleteStation).mockReturnValue({
    mutate: vi.fn(),
    isPending: false,
    error: null,
    ...overrides?.deleteStation,
  } as unknown as ReturnType<typeof useDeleteStation>);
}

describe("StationCard", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("should render station name and location", () => {
    mockHooks();
    render(<StationCard station={unassignedStation} />, {
      wrapper: createWrapper(),
    });

    expect(screen.getByText("Polishing")).toBeInTheDocument();
    expect(screen.getByText("Floor 2")).toBeInTheDocument();
  });

  it("should show assign form when no eye is assigned", () => {
    mockHooks();
    render(<StationCard station={unassignedStation} />, {
      wrapper: createWrapper(),
    });

    expect(
      screen.getByPlaceholderText("Enter eye ID (e.g. eye-1)"),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Assign" })).toBeInTheDocument();
  });

  it("should show eye badge when eye is assigned", () => {
    mockHooks();
    render(<StationCard station={assignedStation} />, {
      wrapper: createWrapper(),
    });

    expect(screen.getByText("eye-1")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Unassign eye eye-1" }),
    ).toBeInTheDocument();
  });

  it("should call assignEye.mutate on assign form submit", async () => {
    const mutate = vi.fn();
    mockHooks({ assignEye: { mutate } });

    const user = userEvent.setup();
    render(<StationCard station={unassignedStation} />, {
      wrapper: createWrapper(),
    });

    await user.type(
      screen.getByPlaceholderText("Enter eye ID (e.g. eye-1)"),
      "eye-42",
    );
    await user.click(screen.getByRole("button", { name: "Assign" }));

    expect(mutate).toHaveBeenCalledWith(
      { stationId: "station-aaa", eyeId: "eye-42" },
      expect.any(Object),
    );
  });

  it("should disable assign button when input is empty", () => {
    mockHooks();
    render(<StationCard station={unassignedStation} />, {
      wrapper: createWrapper(),
    });

    expect(screen.getByRole("button", { name: "Assign" })).toBeDisabled();
  });

  it("should call unassignEye.mutate when unassign button is clicked", async () => {
    const mutate = vi.fn();
    mockHooks({ unassignEye: { mutate } });

    const user = userEvent.setup();
    render(<StationCard station={assignedStation} />, {
      wrapper: createWrapper(),
    });

    await user.click(
      screen.getByRole("button", { name: "Unassign eye eye-1" }),
    );

    expect(mutate).toHaveBeenCalledWith("station-bbb");
  });

  it("should require confirmation before deleting", async () => {
    const mutate = vi.fn();
    mockHooks({ deleteStation: { mutate } });

    const user = userEvent.setup();
    render(<StationCard station={unassignedStation} />, {
      wrapper: createWrapper(),
    });

    await user.click(
      screen.getByRole("button", { name: "Delete station Polishing" }),
    );

    expect(mutate).not.toHaveBeenCalled();
    expect(screen.getByRole("button", { name: "Confirm" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Cancel" })).toBeInTheDocument();
  });

  it("should call deleteStation.mutate on confirm", async () => {
    const mutate = vi.fn();
    mockHooks({ deleteStation: { mutate } });

    const user = userEvent.setup();
    render(<StationCard station={unassignedStation} />, {
      wrapper: createWrapper(),
    });

    await user.click(
      screen.getByRole("button", { name: "Delete station Polishing" }),
    );
    await user.click(screen.getByRole("button", { name: "Confirm" }));

    expect(mutate).toHaveBeenCalledWith("station-aaa", expect.any(Object));
  });

  it("should dismiss confirmation on cancel", async () => {
    mockHooks();

    const user = userEvent.setup();
    render(<StationCard station={unassignedStation} />, {
      wrapper: createWrapper(),
    });

    await user.click(
      screen.getByRole("button", { name: "Delete station Polishing" }),
    );
    await user.click(screen.getByRole("button", { name: "Cancel" }));

    expect(
      screen.getByRole("button", { name: "Delete station Polishing" }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Confirm" }),
    ).not.toBeInTheDocument();
  });

  it("should reset confirmDelete on mutation error", async () => {
    const mutate = vi.fn().mockImplementation((_id, options) => {
      options.onError(new Error("Has events"));
    });
    mockHooks({ deleteStation: { mutate, error: new Error("Has events") } });

    const user = userEvent.setup();
    render(<StationCard station={unassignedStation} />, {
      wrapper: createWrapper(),
    });

    await user.click(
      screen.getByRole("button", { name: "Delete station Polishing" }),
    );
    await user.click(screen.getByRole("button", { name: "Confirm" }));

    await waitFor(() => {
      expect(
        screen.getByRole("button", { name: "Delete station Polishing" }),
      ).toBeInTheDocument();
    });
  });

  it("should display mutation error message", () => {
    mockHooks({ assignEye: { error: new Error("Eye already assigned") } });

    render(<StationCard station={unassignedStation} />, {
      wrapper: createWrapper(),
    });

    expect(screen.getByText("Eye already assigned")).toBeInTheDocument();
  });
});
