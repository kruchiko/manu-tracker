import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { vi } from "vitest";
import { createWrapper } from "../../../test-utils";
import { CreateStationForm } from "./CreateStationForm";

vi.mock("../hooks/useCreateStation", () => ({
  useCreateStation: vi.fn(),
}));

import { useCreateStation } from "../hooks/useCreateStation";

describe("CreateStationForm", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("should render name and location fields", () => {
    vi.mocked(useCreateStation).mockReturnValue({
      mutate: vi.fn(),
      isPending: false,
      error: null,
    } as unknown as ReturnType<typeof useCreateStation>);

    render(<CreateStationForm />, { wrapper: createWrapper() });

    expect(screen.getByLabelText("Name")).toBeInTheDocument();
    expect(screen.getByLabelText(/Location/)).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Create Station" }),
    ).toBeInTheDocument();
  });

  it("should show validation error when name is empty", async () => {
    vi.mocked(useCreateStation).mockReturnValue({
      mutate: vi.fn(),
      isPending: false,
      error: null,
    } as unknown as ReturnType<typeof useCreateStation>);

    const user = userEvent.setup();
    render(<CreateStationForm />, { wrapper: createWrapper() });

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
    render(<CreateStationForm />, { wrapper: createWrapper() });

    await user.type(screen.getByLabelText("Name"), "Polishing");
    await user.type(screen.getByLabelText(/Location/), "Floor 2");
    await user.click(screen.getByRole("button", { name: "Create Station" }));

    await waitFor(() => {
      expect(mutate).toHaveBeenCalledWith(
        { name: "Polishing", location: "Floor 2" },
        expect.any(Object),
      );
    });
  });

  it("should reset the form on successful creation", async () => {
    const mutate = vi.fn().mockImplementation((_values, options) => {
      options.onSuccess();
    });
    vi.mocked(useCreateStation).mockReturnValue({
      mutate,
      isPending: false,
      error: null,
    } as unknown as ReturnType<typeof useCreateStation>);

    const user = userEvent.setup();
    render(<CreateStationForm />, { wrapper: createWrapper() });

    await user.type(screen.getByLabelText("Name"), "Polishing");
    await user.click(screen.getByRole("button", { name: "Create Station" }));

    await waitFor(() => {
      expect(screen.getByLabelText("Name")).toHaveValue("");
    });
  });

  it("should display server error", () => {
    vi.mocked(useCreateStation).mockReturnValue({
      mutate: vi.fn(),
      isPending: false,
      error: new Error("Duplicate name"),
    } as unknown as ReturnType<typeof useCreateStation>);

    render(<CreateStationForm />, { wrapper: createWrapper() });

    expect(screen.getByText("Error: Duplicate name")).toBeInTheDocument();
  });

  it("should disable button while pending", () => {
    vi.mocked(useCreateStation).mockReturnValue({
      mutate: vi.fn(),
      isPending: true,
      error: null,
    } as unknown as ReturnType<typeof useCreateStation>);

    render(<CreateStationForm />, { wrapper: createWrapper() });

    expect(screen.getByRole("button", { name: "Creating..." })).toBeDisabled();
  });
});
