import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { vi } from "vitest";
import { createWrapper } from "../../../test-utils";
import { EditStationView } from "./EditStationView";
import type { Station } from "../stations.types";
import { useUpdateStation } from "../hooks/useUpdateStation";
import { useAssignEye } from "../hooks/useAssignEye";
import { useUnassignEye } from "../hooks/useUnassignEye";
import { usePipelines } from "../../pipelines/hooks/usePipelines";

vi.mock("../hooks/useUpdateStation", () => ({ useUpdateStation: vi.fn() }));
vi.mock("../hooks/useAssignEye", () => ({ useAssignEye: vi.fn() }));
vi.mock("../hooks/useUnassignEye", () => ({ useUnassignEye: vi.fn() }));
vi.mock("../../pipelines/hooks/usePipelines", () => ({ usePipelines: vi.fn() }));
vi.mock("./StationEditDangerZone", () => ({
  StationEditDangerZone: (): null => null,
}));

const station: Station = {
  id: "station-edit1",
  name: "Polishing",
  location: "Floor 2",
  eyeId: null,
  slotCapacity: 3,
};

function mockDefaultHooks(): void {
  vi.mocked(useUpdateStation).mockReturnValue({
    mutateAsync: vi.fn().mockResolvedValue(station),
    mutate: vi.fn(),
    isPending: false,
  } as unknown as ReturnType<typeof useUpdateStation>);
  vi.mocked(useAssignEye).mockReturnValue({
    mutateAsync: vi.fn().mockResolvedValue(station),
    mutate: vi.fn(),
    isPending: false,
  } as unknown as ReturnType<typeof useAssignEye>);
  vi.mocked(useUnassignEye).mockReturnValue({
    mutateAsync: vi.fn().mockResolvedValue(station),
    mutate: vi.fn(),
    isPending: false,
  } as unknown as ReturnType<typeof useUnassignEye>);
  vi.mocked(usePipelines).mockReturnValue({
    data: [],
    isLoading: false,
    isError: false,
    error: null,
  } as unknown as ReturnType<typeof usePipelines>);
}

describe("EditStationView", () => {
  const onBack = vi.fn();

  beforeEach(() => {
    vi.resetAllMocks();
    mockDefaultHooks();
  });

  it("should re-enable Save after updateStation fails", async () => {
    const updateAsync = vi.fn().mockRejectedValue(new Error("Network down"));
    vi.mocked(useUpdateStation).mockReturnValue({
      mutateAsync: updateAsync,
      mutate: vi.fn(),
      isPending: false,
    } as unknown as ReturnType<typeof useUpdateStation>);

    const user = userEvent.setup();
    render(<EditStationView station={station} onBack={onBack} />, { wrapper: createWrapper() });

    await user.click(screen.getByRole("button", { name: "Save changes" }));

    await waitFor(() => {
      expect(screen.getByText("Network down")).toBeInTheDocument();
    });

    const saveBtn = screen.getByRole("button", { name: "Save changes" });
    expect(saveBtn).not.toBeDisabled();
  });

  it("should call updateStation and onBack when saving with no camera change", async () => {
    const updateAsync = vi.fn().mockResolvedValue(station);
    const assignAsync = vi.fn();
    const unassignAsync = vi.fn();
    vi.mocked(useUpdateStation).mockReturnValue({
      mutateAsync: updateAsync,
      mutate: vi.fn(),
      isPending: false,
    } as unknown as ReturnType<typeof useUpdateStation>);
    vi.mocked(useAssignEye).mockReturnValue({
      mutateAsync: assignAsync,
      mutate: vi.fn(),
      isPending: false,
    } as unknown as ReturnType<typeof useAssignEye>);
    vi.mocked(useUnassignEye).mockReturnValue({
      mutateAsync: unassignAsync,
      mutate: vi.fn(),
      isPending: false,
    } as unknown as ReturnType<typeof useUnassignEye>);

    const user = userEvent.setup();
    render(<EditStationView station={station} onBack={onBack} />, { wrapper: createWrapper() });

    await user.click(screen.getByRole("button", { name: "Save changes" }));

    await waitFor(() => {
      expect(onBack).toHaveBeenCalled();
    });

    expect(updateAsync).toHaveBeenCalledWith({
      id: station.id,
      name: station.name,
      location: station.location,
      slotCapacity: station.slotCapacity,
    });
    expect(assignAsync).not.toHaveBeenCalled();
    expect(unassignAsync).not.toHaveBeenCalled();
  });

  it("should call assignEye after update when assigning a camera", async () => {
    const updateAsync = vi.fn().mockResolvedValue(station);
    const assignAsync = vi.fn().mockResolvedValue({ ...station, eyeId: "eye-7" });
    vi.mocked(useUpdateStation).mockReturnValue({
      mutateAsync: updateAsync,
      mutate: vi.fn(),
      isPending: false,
    } as unknown as ReturnType<typeof useUpdateStation>);
    vi.mocked(useAssignEye).mockReturnValue({
      mutateAsync: assignAsync,
      mutate: vi.fn(),
      isPending: false,
    } as unknown as ReturnType<typeof useAssignEye>);

    const user = userEvent.setup();
    render(<EditStationView station={station} onBack={onBack} />, { wrapper: createWrapper() });

    await user.type(screen.getByPlaceholderText(/cam-01, eye-3/), "eye-7");
    await user.click(screen.getByRole("button", { name: "Save changes" }));

    await waitFor(() => {
      expect(onBack).toHaveBeenCalled();
    });

    expect(updateAsync).toHaveBeenCalled();
    expect(assignAsync).toHaveBeenCalledWith({ stationId: station.id, eyeId: "eye-7" });
  });

  it("should call unassignEye after update when clearing the camera", async () => {
    const withEye: Station = { ...station, eyeId: "eye-1" };
    const updateAsync = vi.fn().mockResolvedValue(withEye);
    const unassignAsync = vi.fn().mockResolvedValue({ ...withEye, eyeId: null });
    vi.mocked(useUpdateStation).mockReturnValue({
      mutateAsync: updateAsync,
      mutate: vi.fn(),
      isPending: false,
    } as unknown as ReturnType<typeof useUpdateStation>);
    vi.mocked(useUnassignEye).mockReturnValue({
      mutateAsync: unassignAsync,
      mutate: vi.fn(),
      isPending: false,
    } as unknown as ReturnType<typeof useUnassignEye>);

    const user = userEvent.setup();
    render(<EditStationView station={withEye} onBack={onBack} />, { wrapper: createWrapper() });

    await user.clear(screen.getByPlaceholderText(/cam-01, eye-3/));
    await user.click(screen.getByRole("button", { name: "Save changes" }));

    await waitFor(() => {
      expect(onBack).toHaveBeenCalled();
    });

    expect(updateAsync).toHaveBeenCalled();
    expect(unassignAsync).toHaveBeenCalledWith(station.id);
  });

  it("should call assignEye after update when swapping to a different eye", async () => {
    const withEye: Station = { ...station, eyeId: "eye-1" };
    const updateAsync = vi.fn().mockResolvedValue(withEye);
    const assignAsync = vi.fn().mockResolvedValue({ ...withEye, eyeId: "eye-2" });
    vi.mocked(useUpdateStation).mockReturnValue({
      mutateAsync: updateAsync,
      mutate: vi.fn(),
      isPending: false,
    } as unknown as ReturnType<typeof useUpdateStation>);
    vi.mocked(useAssignEye).mockReturnValue({
      mutateAsync: assignAsync,
      mutate: vi.fn(),
      isPending: false,
    } as unknown as ReturnType<typeof useAssignEye>);

    const user = userEvent.setup();
    render(<EditStationView station={withEye} onBack={onBack} />, { wrapper: createWrapper() });

    const camera = screen.getByPlaceholderText(/cam-01, eye-3/);
    await user.clear(camera);
    await user.type(camera, "eye-2");
    await user.click(screen.getByRole("button", { name: "Save changes" }));

    await waitFor(() => {
      expect(onBack).toHaveBeenCalled();
    });

    expect(assignAsync).toHaveBeenCalledWith({ stationId: station.id, eyeId: "eye-2" });
  });

  it("should show recovery message and not navigate when assignEye fails after update succeeds", async () => {
    const updateAsync = vi.fn().mockResolvedValue(station);
    const assignAsync = vi.fn().mockRejectedValue(new Error("Eye already assigned elsewhere"));
    vi.mocked(useUpdateStation).mockReturnValue({
      mutateAsync: updateAsync,
      mutate: vi.fn(),
      isPending: false,
    } as unknown as ReturnType<typeof useUpdateStation>);
    vi.mocked(useAssignEye).mockReturnValue({
      mutateAsync: assignAsync,
      mutate: vi.fn(),
      isPending: false,
    } as unknown as ReturnType<typeof useAssignEye>);

    const user = userEvent.setup();
    render(<EditStationView station={station} onBack={onBack} />, { wrapper: createWrapper() });

    await user.type(screen.getByPlaceholderText(/cam-01, eye-3/), "eye-9");
    await user.click(screen.getByRole("button", { name: "Save changes" }));

    await waitFor(() => {
      expect(screen.getByText(/Eye already assigned elsewhere/)).toBeInTheDocument();
      expect(screen.getByText(/Station details were saved/)).toBeInTheDocument();
    });
    expect(onBack).not.toHaveBeenCalled();
  });
});
