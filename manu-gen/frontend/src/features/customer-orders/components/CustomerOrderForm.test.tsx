import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { vi } from "vitest";
import { createWrapper } from "../../../test-utils";
import { CustomerOrderForm } from "./CustomerOrderForm";

vi.mock("../hooks/useCreateCustomerOrder", () => ({
  useCreateCustomerOrder: vi.fn(),
}));

vi.mock("../../pipelines/hooks/usePipelines", () => ({
  usePipelines: () => ({
    data: [],
    isLoading: false,
  }),
}));

import { useCreateCustomerOrder } from "../hooks/useCreateCustomerOrder";

describe("CustomerOrderForm", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("should render customer name, due date, line items, and notes fields", () => {
    vi.mocked(useCreateCustomerOrder).mockReturnValue({
      mutate: vi.fn(),
      isPending: false,
      error: null,
    } as unknown as ReturnType<typeof useCreateCustomerOrder>);

    render(<CustomerOrderForm onCreated={vi.fn()} onCancel={vi.fn()} />, {
      wrapper: createWrapper(),
    });

    expect(screen.getByLabelText("Customer name")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Line items" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Create Order" })).toBeInTheDocument();
  });

  it("should show validation error when customer name is empty", async () => {
    vi.mocked(useCreateCustomerOrder).mockReturnValue({
      mutate: vi.fn(),
      isPending: false,
      error: null,
    } as unknown as ReturnType<typeof useCreateCustomerOrder>);

    const user = userEvent.setup();
    render(<CustomerOrderForm onCreated={vi.fn()} onCancel={vi.fn()} />, {
      wrapper: createWrapper(),
    });

    await user.click(screen.getByRole("button", { name: "Create Order" }));

    await waitFor(() => {
      expect(screen.getByText(/Customer name is required/i)).toBeInTheDocument();
    });
  });

  it("should display server error", () => {
    vi.mocked(useCreateCustomerOrder).mockReturnValue({
      mutate: vi.fn(),
      isPending: false,
      error: new Error("Duplicate order"),
    } as unknown as ReturnType<typeof useCreateCustomerOrder>);

    render(<CustomerOrderForm onCreated={vi.fn()} onCancel={vi.fn()} />, {
      wrapper: createWrapper(),
    });

    expect(screen.getByText("Error: Duplicate order")).toBeInTheDocument();
  });

  it("should disable button while pending", () => {
    vi.mocked(useCreateCustomerOrder).mockReturnValue({
      mutate: vi.fn(),
      isPending: true,
      error: null,
    } as unknown as ReturnType<typeof useCreateCustomerOrder>);

    render(<CustomerOrderForm onCreated={vi.fn()} onCancel={vi.fn()} />, {
      wrapper: createWrapper(),
    });

    expect(screen.getByRole("button", { name: /Creating/i })).toBeDisabled();
  });

  it("should allow adding more line items", async () => {
    vi.mocked(useCreateCustomerOrder).mockReturnValue({
      mutate: vi.fn(),
      isPending: false,
      error: null,
    } as unknown as ReturnType<typeof useCreateCustomerOrder>);

    const user = userEvent.setup();
    render(<CustomerOrderForm onCreated={vi.fn()} onCancel={vi.fn()} />, {
      wrapper: createWrapper(),
    });

    await user.click(screen.getByRole("button", { name: /Add line item/i }));

    const productInputs = screen.getAllByLabelText(/^Product type$/i);
    expect(productInputs).toHaveLength(2);
  });
});
