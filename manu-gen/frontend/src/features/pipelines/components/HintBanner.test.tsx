import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { HintBanner } from "./HintBanner";

describe("HintBanner", () => {
  it("renders the pipelines guidance title and body", () => {
    render(<HintBanner />);

    expect(screen.getByText("One pipeline per product type")).toBeInTheDocument();
    expect(
      screen.getByText(/Each product type follows its own sequence of stations/i),
    ).toBeInTheDocument();
    expect(screen.getByText("3 steps")).toBeInTheDocument();
    expect(screen.getByText("5 steps")).toBeInTheDocument();
  });

  it("dismisses when the close control is activated", async () => {
    const user = userEvent.setup();
    const { container } = render(<HintBanner />);

    expect(screen.getByRole("button", { name: "Dismiss hint" })).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Dismiss hint" }));

    expect(container.firstChild).toBeNull();
  });
});
