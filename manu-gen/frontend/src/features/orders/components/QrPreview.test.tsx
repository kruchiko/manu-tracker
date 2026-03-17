import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QrPreview } from "./QrPreview";
import { vi } from "vitest";
import { createWrapper } from "../../../test-utils";
import type { Order } from "../orders.types";

vi.mock("../hooks/useQrCode", () => ({ useQrCode: vi.fn() }));

import { useQrCode } from "../hooks/useQrCode";

const sampleOrder: Order = {
  id: 1,
  orderNumber: "ORD-0001",
  trayCode: "TRAY-0001",
  customerName: "Acme",
  productType: "Widget",
  quantity: 2,
  notes: "",
  createdAt: "2024-01-01T00:00:00Z",
};

describe("QrPreview", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("should show loading state", () => {
    vi.mocked(useQrCode).mockReturnValue({
      isLoading: true,
      data: undefined,
      error: null,
    } as unknown as ReturnType<typeof useQrCode>);

    render(<QrPreview order={sampleOrder} />, { wrapper: createWrapper() });

    expect(screen.getByText("Loading QR code…")).toBeInTheDocument();
  });

  it("should render QR image and tray code when data is available", () => {
    vi.mocked(useQrCode).mockReturnValue({
      isLoading: false,
      data: { qr: "data:image/png;base64,abc123" },
      error: null,
    } as unknown as ReturnType<typeof useQrCode>);

    render(<QrPreview order={sampleOrder} />, { wrapper: createWrapper() });

    expect(screen.getByAltText("QR code")).toHaveAttribute(
      "src",
      "data:image/png;base64,abc123",
    );
    expect(screen.getByText("TRAY-0001")).toBeInTheDocument();
    expect(screen.getByText("ORD-0001")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Print" })).toBeInTheDocument();
  });

  it("should call window.print when Print button is clicked", async () => {
    vi.mocked(useQrCode).mockReturnValue({
      isLoading: false,
      data: { qr: "data:image/png;base64,abc123" },
      error: null,
    } as unknown as ReturnType<typeof useQrCode>);

    const printSpy = vi.spyOn(window, "print").mockImplementation(() => {});
    const user = userEvent.setup();
    render(<QrPreview order={sampleOrder} />, { wrapper: createWrapper() });

    await user.click(screen.getByRole("button", { name: "Print" }));

    expect(printSpy).toHaveBeenCalledOnce();
  });

  it("should show error message on fetch failure", () => {
    vi.mocked(useQrCode).mockReturnValue({
      isLoading: false,
      data: undefined,
      error: new Error("Not found"),
    } as unknown as ReturnType<typeof useQrCode>);

    render(<QrPreview order={sampleOrder} />, { wrapper: createWrapper() });

    expect(screen.getByText(/Not found/)).toBeInTheDocument();
  });
});
