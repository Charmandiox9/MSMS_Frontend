import { useState } from "react";
import { act, fireEvent, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { renderAs } from "@/test/render";
import SearchField from "./SearchField";

function SearchFieldHarness({ pending = false }: { pending?: boolean }) {
  const [value, setValue] = useState("Durán");

  return (
    <SearchField
      label="Buscar expediente"
      value={value}
      onChange={setValue}
      help="Nombre, RUT o folio"
      pending={pending}
    />
  );
}

describe("SearchField", () => {
  it("connects its label and help text to the search input", () => {
    renderAs(<SearchFieldHarness />);

    const input = screen.getByRole("searchbox", { name: "Buscar expediente" });
    const help = screen.getByText("Nombre, RUT o folio");

    expect(input.getAttribute("aria-describedby")).toBe(help.id);
  });

  it("clears the controlled value and restores focus from the clear button", () => {
    renderAs(<SearchFieldHarness />);

    const input = screen.getByRole("searchbox", { name: "Buscar expediente" });
    fireEvent.click(screen.getByRole("button", { name: "Borrar búsqueda" }));

    expect((input as HTMLInputElement).value).toBe("");
    expect(document.activeElement).toBe(input);
    expect(screen.queryByRole("button", { name: "Borrar búsqueda" })).toBeNull();
  });

  it("clears the query on Escape and announces pending searches", () => {
    renderAs(<SearchFieldHarness pending />);

    const input = screen.getByRole("searchbox", { name: "Buscar expediente" });
    expect(screen.getByRole("status").textContent).toBe("Buscando…");

    act(() => fireEvent.keyDown(input, { key: "Escape" }));

    expect((input as HTMLInputElement).value).toBe("");
    expect(document.activeElement).toBe(input);
  });
});
