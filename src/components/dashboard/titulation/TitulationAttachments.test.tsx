import { fireEvent, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderAs } from "@/test/render";
import TitulationAttachments from "./TitulationAttachments";

type ApiFetchMock = (path: string, init?: RequestInit) => Promise<unknown>;

const { apiFetchMock, apiFetchFileMock, downloadBlobMock } = vi.hoisted(() => ({
  apiFetchMock: vi.fn<ApiFetchMock>(),
  apiFetchFileMock: vi.fn<(path: string, contentType: string) => Promise<Blob>>(),
  downloadBlobMock: vi.fn<(filename: string, blob: Blob) => void>(),
}));

vi.mock("@/lib/api", () => ({
  apiFetch: apiFetchMock,
  apiFetchFile: apiFetchFileMock,
}));
vi.mock("@/lib/download", () => ({ downloadBlob: downloadBlobMock }));

const attachment = {
  id: "attachment-1",
  originalName: "Acta de Ejemplo.pdf",
  contentType: "application/pdf",
  size: 12,
  createdAt: "2026-11-18T12:00:00.000Z",
};

describe("TitulationAttachments", () => {
  beforeEach(() => {
    apiFetchMock.mockReset();
    apiFetchFileMock.mockReset();
    downloadBlobMock.mockReset();
    apiFetchMock.mockResolvedValue([]);
  });

  it("uploads a selected PDF only after explicit confirmation", async () => {
    const uploaded = { ...attachment, id: "attachment-2" };
    apiFetchMock.mockImplementation(async (_path, init) =>
      init?.method === "POST" ? uploaded : [],
    );
    renderAs(<TitulationAttachments processId="process-1" />);

    await screen.findByText("Este expediente aún no tiene archivos adjuntos.");
    const file = new File(["%PDF-1.7"], "acta.pdf", { type: "application/pdf" });
    fireEvent.change(screen.getByLabelText("Seleccionar archivo"), {
      target: { files: [file] },
    });

    expect(apiFetchMock).toHaveBeenCalledTimes(1);
    expect(screen.getByRole("button", { name: "Adjuntar archivo" }).hasAttribute("disabled")).toBe(false);
    fireEvent.click(screen.getByRole("button", { name: "Adjuntar archivo" }));

    expect(await screen.findByText("Archivo adjuntado al expediente.")).toBeTruthy();
    expect(await screen.findByText("Acta de Ejemplo.pdf")).toBeTruthy();
    const uploadCall = apiFetchMock.mock.calls.find(([, init]) => init?.method === "POST");
    expect(uploadCall?.[0]).toBe("/academic/titulations/process-1/attachments");
    expect((uploadCall?.[1]?.body as FormData).get("file")).toMatchObject({
      name: "acta.pdf",
      type: "application/pdf",
    });
  });

  it("blocks unsupported files before sending them", async () => {
    renderAs(<TitulationAttachments processId="process-1" />);
    await screen.findByText("Este expediente aún no tiene archivos adjuntos.");

    const file = new File(["example"], "script.txt", { type: "text/plain" });
    fireEvent.change(screen.getByLabelText("Seleccionar archivo"), {
      target: { files: [file] },
    });

    expect(screen.getByRole("alert").textContent).toContain(
      "Selecciona un PDF o documento Word (.docx).",
    );
    expect(screen.getByRole("button", { name: "Adjuntar archivo" }).hasAttribute("disabled")).toBe(true);
    expect(apiFetchMock).toHaveBeenCalledTimes(1);
  });

  it("downloads an attachment using its safe display name", async () => {
    apiFetchMock.mockResolvedValue([attachment]);
    const file = new Blob(["pdf"], { type: "application/octet-stream" });
    apiFetchFileMock.mockResolvedValue(file);
    renderAs(<TitulationAttachments processId="process-1" />);

    fireEvent.click(
      await screen.findByRole("button", { name: "Descargar archivo" }),
    );

    await waitFor(() =>
      expect(downloadBlobMock).toHaveBeenCalledWith("Acta de Ejemplo.pdf", file),
    );
    expect(apiFetchFileMock).toHaveBeenCalledWith(
      "/academic/titulations/process-1/attachments/attachment-1/file",
      "application/octet-stream",
    );
  });

  it("offers a retry when loading the attachments fails", async () => {
    apiFetchMock
      .mockRejectedValueOnce(new Error("network error"))
      .mockResolvedValueOnce([]);
    renderAs(<TitulationAttachments processId="process-1" />);

    fireEvent.click(await screen.findByRole("button", { name: "Volver a cargar" }));

    expect(
      await screen.findByText("Este expediente aún no tiene archivos adjuntos."),
    ).toBeTruthy();
    expect(apiFetchMock).toHaveBeenCalledTimes(2);
  });
});
