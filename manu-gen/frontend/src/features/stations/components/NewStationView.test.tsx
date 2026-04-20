import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { vi } from "vitest";
import { createWrapper } from "../../../test-utils";
import { NewStationView } from "./NewStationView";
import type { Station } from "../stations.types";
import { useCreateStation } from "../hooks/useCreateStation";
import { useAssignEye } from "../hooks/useAssignEye";

vi.mock("../hooks/useCreateStation", () => ({ useCreateStation: vi.fn() }));
vi.mock("../hooks/useAssignEye", () => ({ useAssignEye: vi.fn() }));

const createdStation: Station = {
  id: "station-new1",
  name: "Polishing",
  location: "Floor 2",
  eyeId: null,
  slotCapacity: 1,
};

function mockDefaultHooks(): void {
  vi.mocked(useCreateStation).mockReturnValue({
    mutateAsync: vi.fn().mockResolvedValue(createdStation),
    mutate: vi.fn(),
    isPending: false,
  } as unknown as ReturnType<typeof useCreateStation>);
  vi.mocked(useAssignEye).mockReturnValue({
    mutateAsync: vi.fn().mockResolvedValue(createdStation),
    mutate: vi.fn(),
    isPending: false,
  } as unknown as ReturnType<typeof useAssignEye>);
}

describe("NewStationView", () => {
  const onBack = vi.fn();

  beforeEach(() => {
    vi.resetAllMocks();
    mockDefaultHooks();
  });

  it("should render form fields and preview", () => {
    render(<NewStationView onBack={onBack} />, { wrapper: createWrapper() });

    expect(screen.getByRole("heading", { level: 1, name: "New Station" })).toBeInTheDocument();
    expect(screen.getByText("Station details")).toBeInTheDocument();
    expect(screen.getByText("Preview")).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Kiln A/)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Building B/)).toBeInTheDocument();
  });

  it("should call onBack when back button is clicked", async () => {
    const user = userEvent.setup();
    render(<NewStationView onBack={onBack} />, { wrapper: createWrapper() });

    await user.click(screen.getByRole("button", { name: /Stations/ }));

    expect(onBack).toHaveBeenCalled();
  });

  it("should show validation error when name is empty", async () => {
    const user = userEvent.setup();
    render(<NewStationView onBack={onBack} />, { wrapper: createWrapper() });

    await user.click(screen.getByRole("button", { name: "Create Station" }));

    await waitFor(() => {
      expect(screen.getByText("Station name is required")).toBeInTheDocument();
    });
  });

  it("should call createStation with form values on valid submit", async () => {
    const createAsync = vi.fn().mockResolvedValue(createdStation);
    vi.mocked(useCreateStation).mockReturnValue({
      mutateAsync: createAsync,
      mutate: vi.fn(),
      isPending: false,
    } as unknown as ReturnType<typeof useCreateStation>);

    const user = userEvent.setup();
    render(<NewStationView onBack={onBack} />, { wrapper: createWrapper() });

    await user.type(screen.getByPlaceholderText(/Kiln A/), "Polishing");
    await user.type(screen.getByPlaceholderText(/Building B/), "Floor 2");
    await user.click(screen.getByRole("button", { name: "Create Station" }));

    await waitFor(() => {
      expect(createAsync).toHaveBeenCalledWith(
        expect.objectContaining({
          name: "Polishing",
          location: "Floor 2",
          slotCapacity: 1,
          cameraId: "",
        }),
      );
    });
  });

  it("should call assignEye after create when camera ID is set", async () => {
    const createAsync = vi.fn().mockResolvedValue(createdStation);
    const assignAsync = vi.fn().mockResolvedValue({ ...createdStation, eyeId: "eye-9" });
    vi.mocked(useCreateStation).mockReturnValue({
      mutateAsync: createAsync,
      mutate: vi.fn(),
      isPending: false,
    } as unknown as ReturnType<typeof useCreateStation>);
    vi.mocked(useAssignEye).mockReturnValue({
      mutateAsync: assignAsync,
      mutate: vi.fn(),
      isPending: false,
    } as unknown as ReturnType<typeof useAssignEye>);

    const user = userEvent.setup();
    render(<NewStationView onBack={onBack} />, { wrapper: createWrapper() });

    await user.type(screen.getByPlaceholderText(/Kiln A/), "Polishing");
    await user.type(screen.getByPlaceholderText(/cam-01, eye-3/), "eye-9");
    await user.click(screen.getByRole("button", { name: "Create Station" }));

    await waitFor(() => {
      expect(createAsync).toHaveBeenCalled();
      expect(assignAsync).toHaveBeenCalledWith({ stationId: createdStation.id, eyeId: "eye-9" });
    });
  });

  it("should display submit error when create fails", async () => {
    vi.mocked(useCreateStation).mockReturnValue({
      mutateAsync: vi.fn().mockRejectedValue(new Error("Duplicate name")),
      mutate: vi.fn(),
      isPending: false,
    } as unknown as ReturnType<typeof useCreateStation>);

    const user = userEvent.setup();
    render(<NewStationView onBack={onBack} />, { wrapper: createWrapper() });

    await user.type(screen.getByPlaceholderText(/Kiln A/), "Polishing");
    await user.click(screen.getByRole("button", { name: "Create Station" }));

    await waitFor(() => {
      expect(screen.getByText("Duplicate name")).toBeInTheDocument();
    });
  });

  it("should disable submit while save is in progress", async () => {
    let resolveCreate!: (s: Station) => void;
    const createPromise = new Promise<Station>((resolve) => {
      resolveCreate = resolve;
    });
    const createAsync = vi.fn().mockReturnValue(createPromise);
    vi.mocked(useCreateStation).mockReturnValue({
      mutateAsync: createAsync,
      mutate: vi.fn(),
      isPending: false,
    } as unknown as ReturnType<typeof useCreateStation>);

    const user = userEvent.setup();
    render(<NewStationView onBack={onBack} />, { wrapper: createWrapper() });

    await user.type(screen.getByPlaceholderText(/Kiln A/), "Polishing");
    const clickPromise = user.click(screen.getByRole("button", { name: "Create Station" }));

    await waitFor(() => {
      expect(screen.getByRole("button", { name: "Saving..." })).toBeDisabled();
    });

    resolveCreate(createdStation);
    await clickPromise;
  });

  it("should show recovery message when assign fails after station is created", async () => {
    const createAsync = vi.fn().mockResolvedValue(createdStation);
    const assignAsync = vi.fn().mockRejectedValue(new Error("Eye already assigned"));
    vi.mocked(useCreateStation).mockReturnValue({
      mutateAsync: createAsync,
      mutate: vi.fn(),
      isPending: false,
    } as unknown as ReturnType<typeof useCreateStation>);
    vi.mocked(useAssignEye).mockReturnValue({
      mutateAsync: assignAsync,
      mutate: vi.fn(),
      isPending: false,
    } as unknown as ReturnType<typeof useAssignEye>);

    const user = userEvent.setup();
    render(<NewStationView onBack={onBack} />, { wrapper: createWrapper() });

    await user.type(screen.getByPlaceholderText(/Kiln A/), "Polishing");
    await user.type(screen.getByPlaceholderText(/cam-01, eye-3/), "eye-1");
    await user.click(screen.getByRole("button", { name: "Create Station" }));

    await waitFor(() => {
      expect(screen.getByText(/Eye already assigned/)).toBeInTheDocument();
      expect(screen.getByText(/The station was created/)).toBeInTheDocument();
    });
    expect(onBack).not.toHaveBeenCalled();
  });

  it("should navigate back on successful creation", async () => {
    const createAsync = vi.fn().mockResolvedValue(createdStation);
    vi.mocked(useCreateStation).mockReturnValue({
      mutateAsync: createAsync,
      mutate: vi.fn(),
      isPending: false,
    } as unknown as ReturnType<typeof useCreateStation>);

    const user = userEvent.setup();
    render(<NewStationView onBack={onBack} />, { wrapper: createWrapper() });

    await user.type(screen.getByPlaceholderText(/Kiln A/), "Polishing");
    await user.click(screen.getByRole("button", { name: "Create Station" }));

    await waitFor(() => {
      expect(onBack).toHaveBeenCalled();
    });
  });
});
