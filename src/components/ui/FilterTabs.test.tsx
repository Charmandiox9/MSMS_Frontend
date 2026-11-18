import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import FilterTabs from "./FilterTabs";

describe("FilterTabs", () => {
  it("announces the selected filter and allows switching using native buttons", () => {
    const change = vi.fn();
    render(
      <FilterTabs
        label="Record views"
        value="all"
        onChange={change}
        options={[
          { value: "all", label: "All records", count: 12 },
          { value: "review", label: "To review", count: 3 },
        ]}
      />,
    );
    expect(
      screen.getByRole("navigation", { name: "Record views" }),
    ).toBeDefined();
    expect(
      screen
        .getByRole("button", { name: "All records 12" })
        .getAttribute("aria-pressed"),
    ).toBe("true");
    const next = screen.getByRole("button", { name: "To review 3" });
    next.focus();
    expect(document.activeElement).toBe(next);
    fireEvent.click(next);
    expect(change).toHaveBeenCalledWith("review");
  });
});
