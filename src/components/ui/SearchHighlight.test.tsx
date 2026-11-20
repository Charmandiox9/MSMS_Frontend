import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import SearchHighlight from "./SearchHighlight";

describe("SearchHighlight", () => {
  it("highlights accent-insensitive matches without changing the source text", () => {
    render(<SearchHighlight text="Biología Marina" query="BIOLOGIA" />);

    expect(screen.getByText("Biología").tagName).toBe("MARK");
    expect(document.body.textContent).toContain("Biología Marina");
  });

  it("leaves the text unchanged when no match exists", () => {
    const { container } = render(
      <SearchHighlight text="Biología Marina" query="Acuicultura" />,
    );

    expect(container.querySelector("mark")).toBeNull();
    expect(container.textContent).toBe("Biología Marina");
  });
});
