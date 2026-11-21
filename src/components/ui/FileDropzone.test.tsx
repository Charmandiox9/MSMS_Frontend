import { fireEvent, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { renderAs } from "@/test/render";
import FileDropzone from "./FileDropzone";

describe("FileDropzone", () => {
  it("accepts a dropped file and keeps the file picker available", () => {
    const onFileDrop = vi.fn();
    const file = new File(["contents"], "courses.csv", { type: "text/csv" });
    renderAs(
      <FileDropzone onFileDrop={onFileDrop}>
        <label htmlFor="file-picker">Seleccionar archivo</label>
        <input id="file-picker" type="file" />
      </FileDropzone>,
    );

    const dropzone = screen.getByRole("group", {
      name: "Zona para cargar archivos",
    });
    fireEvent.dragEnter(dropzone, {
      dataTransfer: { files: [file], types: ["Files"] },
    });

    expect(
      screen.getByText("Suelta el archivo para seleccionarlo."),
    ).toBeDefined();
    expect(screen.getByLabelText("Seleccionar archivo")).toBeDefined();

    fireEvent.drop(dropzone, {
      dataTransfer: { files: [file], types: ["Files"] },
    });

    expect(onFileDrop).toHaveBeenCalledOnce();
    expect(onFileDrop).toHaveBeenCalledWith(file);
  });

  it("ignores dropped files when disabled", () => {
    const onFileDrop = vi.fn();
    const file = new File(["contents"], "courses.csv", { type: "text/csv" });
    renderAs(
      <FileDropzone disabled onFileDrop={onFileDrop}>
        <label htmlFor="file-picker">Seleccionar archivo</label>
        <input id="file-picker" type="file" disabled />
      </FileDropzone>,
    );

    fireEvent.drop(
      screen.getByRole("group", { name: "Zona para cargar archivos" }),
      { dataTransfer: { files: [file], types: ["Files"] } },
    );

    expect(onFileDrop).not.toHaveBeenCalled();
  });
});
