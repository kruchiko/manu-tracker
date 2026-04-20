import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi } from "vitest";
import { DismissibleNoticeBanner } from "./DismissibleNoticeBanner";

describe("DismissibleNoticeBanner", () => {
  it("renders message and calls onDismiss when close is activated", async () => {
    const onDismiss = vi.fn();
    const user = userEvent.setup();
    render(
      <DismissibleNoticeBanner message="Something went wrong" onDismiss={onDismiss} variant="alert" />,
    );

    expect(screen.getByRole("alert")).toHaveTextContent("Something went wrong");
    await user.click(screen.getByRole("button", { name: "Dismiss notification" }));
    expect(onDismiss).toHaveBeenCalledTimes(1);
  });

  it("uses role=status for success variant", () => {
    render(
      <DismissibleNoticeBanner message="Saved" onDismiss={vi.fn()} variant="success" dismissAriaLabel="Close" />,
    );

    expect(screen.getByRole("status")).toHaveTextContent("Saved");
  });

  it("uses custom dismiss aria-label", async () => {
    const user = userEvent.setup();
    render(
      <DismissibleNoticeBanner
        message="Hi"
        onDismiss={vi.fn()}
        dismissAriaLabel="Close banner"
      />,
    );

    expect(screen.getByRole("button", { name: "Close banner" })).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Close banner" }));
  });
});
