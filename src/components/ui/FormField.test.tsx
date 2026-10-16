import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import FormField from "./FormField";

describe("FormField component", () => {
  it("renders label and child input properly", () => {
    render(
      <FormField label="Correo Institucional" htmlFor="test-email">
        <input id="test-email" type="email" />
      </FormField>,
    );

    expect(screen.getByText("Correo Institucional")).toBeDefined();
    expect(screen.getByRole("textbox")).toBeDefined();
  });

  it("shows asterisk when required is true", () => {
    render(
      <FormField label="Nombre Docente" htmlFor="test-name" required>
        <input id="test-name" type="text" />
      </FormField>,
    );

    expect(screen.getByText("*")).toBeDefined();
  });

  it("renders error message with alert role when provided", () => {
    render(
      <FormField
        label="Correo Institucional"
        htmlFor="test-email"
        error="El correo no es válido"
      >
        <input id="test-email" type="email" />
      </FormField>,
    );

    const alert = screen.getByRole("alert");
    expect(alert).toBeDefined();
    expect(alert.textContent).toBe("El correo no es válido");
  });

  it("renders hint when no error is present", () => {
    render(
      <FormField
        label="Grado Académico"
        htmlFor="test-degree"
        hint="Ej: Doctor en Informática"
      >
        <input id="test-degree" type="text" />
      </FormField>,
    );

    expect(screen.getByText("Ej: Doctor en Informática")).toBeDefined();
  });
});
