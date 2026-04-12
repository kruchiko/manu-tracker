import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { vi } from "vitest";
import { ConfirmDialog } from "./ConfirmDialog";

function Harness({
  onConfirm,
  onCancel,
}: {
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div>
      <button type="button" onClick={() => setOpen(true)}>
        Open
      </button>
      <ConfirmDialog
        open={open}
        title="Confirm action?"
        message="This cannot be undone."
        confirmLabel="Yes, do it"
        cancelLabel="No"
        onConfirm={() => {
          onConfirm();
          setOpen(false);
        }}
        onCancel={() => {
          onCancel();
          setOpen(false);
        }}
      />
    </div>
  );
}

describe("ConfirmDialog", () => {
  it("links the message to the dialog with aria-describedby", async () => {
    const user = userEvent.setup();
    render(
      <Harness
        onConfirm={vi.fn()}
        onCancel={vi.fn()}
      />,
    );

    await user.click(screen.getByRole("button", { name: "Open" }));

    const dialog = screen.getByRole("alertdialog");
    const describedBy = dialog.getAttribute("aria-describedby");
    expect(describedBy).toBeTruthy();
    const desc = document.getElementById(describedBy!);
    expect(desc).toHaveTextContent("This cannot be undone.");
  });

  it("moves focus to the cancel button when opened", async () => {
    const user = userEvent.setup();
    render(
      <Harness
        onConfirm={vi.fn()}
        onCancel={vi.fn()}
      />,
    );

    await user.click(screen.getByRole("button", { name: "Open" }));

    expect(screen.getByRole("button", { name: "No" })).toHaveFocus();
  });

  it("returns focus to the trigger when closed", async () => {
    const user = userEvent.setup();
    render(
      <Harness
        onConfirm={vi.fn()}
        onCancel={vi.fn()}
      />,
    );

    const opener = screen.getByRole("button", { name: "Open" });
    await user.click(opener);
    await user.click(screen.getByRole("button", { name: "No" }));

    expect(opener).toHaveFocus();
  });

  it("cycles focus between buttons with Tab", async () => {
    const user = userEvent.setup();
    render(
      <Harness
        onConfirm={vi.fn()}
        onCancel={vi.fn()}
      />,
    );

    await user.click(screen.getByRole("button", { name: "Open" }));

    const cancelBtn = screen.getByRole("button", { name: "No" });
    const confirmBtn = screen.getByRole("button", { name: "Yes, do it" });

    expect(cancelBtn).toHaveFocus();
    await user.tab();
    expect(confirmBtn).toHaveFocus();
    await user.tab();
    expect(cancelBtn).toHaveFocus();
  });

  it("calls onCancel when Escape is pressed", async () => {
    const user = userEvent.setup();
    const onCancel = vi.fn();
    render(
      <Harness
        onConfirm={vi.fn()}
        onCancel={onCancel}
      />,
    );

    await user.click(screen.getByRole("button", { name: "Open" }));
    await user.keyboard("{Escape}");

    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it("calls onConfirm when the confirm button is clicked", async () => {
    const user = userEvent.setup();
    const onConfirm = vi.fn();
    render(
      <Harness
        onConfirm={onConfirm}
        onCancel={vi.fn()}
      />,
    );

    await user.click(screen.getByRole("button", { name: "Open" }));
    await user.click(screen.getByRole("button", { name: "Yes, do it" }));

    expect(onConfirm).toHaveBeenCalledTimes(1);
  });
});
