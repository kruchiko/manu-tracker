import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { vi } from "vitest";
import { createWrapper } from "../../../test-utils";
import { NewStationView } from "./NewStationView";

vi.mock("../hooks/useCreateStation", () => ({
  useCreateStation: vi.fn(),
}));

import { useCreateStation } from "../hooks/useCreateStation";

describe("NewStationView", () => {
  const onBack = vi.fn();

  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("should render form fields and preview", () => {
    vi.mocked(useCreateStation).mockReturnValue({
      mutate: vi.fn(),
      isPending: false,
      error: null,
    } as unknown as ReturnType<typeof useCreateStation>);

    render(<NewStationView onBack={onBack} />, { wrapper: createWrapper() });

    expect(screen.getByRole("heading", { level: 1, name: "New Station" })).toBeInTheDocument();
    expect(screen.getByText("Station details")).toBeInTheDocument();
    expect(screen.getByText("Preview")).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Kiln A/)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Building B/)).toBeInTheDocument();
  });

  it("should call onBack when back button is clicked", async () => {
    vi.mocked(useCreateStation).mockReturnValue({
      mutate: vi.fn(),
      isPending: false,
      error: null,
    } as unknown as ReturnType<typeof useCreateStation>);

    const user = userEvent.setup();
    render(<NewStationView onBack={onBack} />, { wrapper: createWrapper() });

    await user.click(screen.getByRole("button", { name: /Stations/ }));

    expect(onBack).toHaveBeenCalled();
  });

  it("should show validation error when name is empty", async () => {
    vi.mocked(useCreateStation).mockReturnValue({
      mutate: vi.fn(),
      isPending: false,
      error: null,
    } as unknown as ReturnType<typeof useCreateStation>);

    const user = userEvent.setup();
    render(<NewStationView onBack={onBack} />, { wrapper: createWrapper() });

    await user.click(screen.getByRole("button", { name: "Create Station" }));

    await waitFor(() => {
      expect(
        screen.getByText("Station name is required"),
      ).toBeInTheDocument();
    });
  });

  it("should call mutate with form values on valid submit", async () => {
    const mutate = vi.fn();
    vi.mocked(useCreateStation).mockReturnValue({
      mutate,
      isPending: false,
      error: null,
    } as unknown as ReturnType<typeof useCreateStation>);

    const user = userEvent.setup();
    render(<NewStationView onBack={onBack} />, { wrapper: createWrapper() });

    await user.type(screen.getByPlaceholderText(/Kiln A/), "Polishing");
    await user.type(screen.getByPlaceholderText(/Building B/), "Floor 2");
    await user.click(screen.getByRole("button", { name: "Create Station" }));

    await waitFor(() => {
      expect(mutate).toHaveBeenCalledWith(
        expect.objectContaining({ name: "Polishing", location: "Floor 2" }),
        expect.any(Object),
      );
    });
  });

  it("should display server error", () => {
    vi.mocked(useCreateStation).mockReturnValue({
      mutate: vi.fn(),
      isPending: false,
      error: new Error("Duplicate name"),
    } as unknown as ReturnType<typeof useCreateStation>);

    render(<NewStationView onBack={onBack} />, { wrapper: createWrapper() });

    expect(screen.getByText("Duplicate name")).toBeInTheDocument();
  });

  it("should disable submit button while pending", () => {
    vi.mocked(useCreateStation).mockReturnValue({
      mutate: vi.fn(),
      isPending: true,
      error: null,
    } as unknown as ReturnType<typeof useCreateStation>);

    render(<NewStationView onBack={onBack} />, { wrapper: createWrapper() });

    expect(screen.getByRole("button", { name: "Saving..." })).toBeDisabled();
  });

  it("should navigate back on successful creation", async () => {
    const mutate = vi.fn().mockImplementation((_values, options) => {
      options.onSuccess();
    });
    vi.mocked(useCreateStation).mockReturnValue({
      mutate,
      isPending: false,
      error: null,
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
