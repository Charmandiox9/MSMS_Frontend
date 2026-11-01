import { fireEvent, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import DataRightsRequests from "./DataRightsRequests";
import { renderAs } from "@/test/render";
import { apiFetch } from "@/lib/api";

vi.mock("@/lib/api", () => ({ apiFetch: vi.fn() }));

const request = {
  id: "request-1",
  rightType: "ACCESS" as const,
  status: "RECEIVED" as const,
  responseNote: null,
  createdAt: "2026-11-01T00:00:00.000Z",
  updatedAt: "2026-11-01T00:00:00.000Z",
  dueAt: "2026-12-01T00:00:00.000Z",
};

describe("DataRightsRequests", () => {
  beforeEach(() => {
    vi.mocked(apiFetch).mockReset();
    localStorage.clear();
  });

  it("submits only the selected right and shows the account holder's requests", async () => {
    vi.mocked(apiFetch)
      .mockResolvedValueOnce([] as never)
      .mockResolvedValueOnce(request as never)
      .mockResolvedValueOnce([request] as never);
    renderAs(<DataRightsRequests />, ["ACADEMIC_SECRETARY"]);

    await screen.findByText("Aún no has registrado solicitudes.");
    fireEvent.change(screen.getByLabelText("Derecho que deseas ejercer"), {
      target: { value: "PORTABILITY" },
    });
    fireEvent.change(await screen.findByLabelText(/Indica los datos cuyo traslado solicitas/), {
      target: { value: "Mis datos académicos" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Enviar solicitud" }));

    await waitFor(() => {
      expect(apiFetch).toHaveBeenCalledWith("/privacy/requests", {
        method: "POST",
        body: JSON.stringify({ rightType: "PORTABILITY", details: "Mis datos académicos" }),
      });
    });
    await screen.findByText("Acceso");
    expect((screen.getByLabelText(/Indica los datos cuyo traslado solicitas/) as HTMLTextAreaElement).value).toBe("");
  });

  it("requires and submits details for non-access requests", async () => {
    vi.mocked(apiFetch)
      .mockResolvedValueOnce([] as never)
      .mockResolvedValueOnce({ ...request, rightType: "RECTIFICATION" } as never)
      .mockResolvedValueOnce([] as never);
    renderAs(<DataRightsRequests />, ["ACADEMIC_SECRETARY"]);

    await screen.findByText("Aún no has registrado solicitudes.");
    fireEvent.change(screen.getByLabelText("Derecho que deseas ejercer"), {
      target: { value: "RECTIFICATION" },
    });
    const details = await screen.findByLabelText(/Indica los datos que deben corregirse y el cambio solicitado/);
    expect(details).toHaveProperty("required", true);
    fireEvent.change(details, { target: { value: "Corregir mi correo de contacto" } });
    fireEvent.click(screen.getByRole("button", { name: "Enviar solicitud" }));

    await waitFor(() => {
      expect(apiFetch).toHaveBeenCalledWith("/privacy/requests", {
        method: "POST",
        body: JSON.stringify({ rightType: "RECTIFICATION", details: "Corregir mi correo de contacto" }),
      });
    });
  });

  it("loads the restricted request queue for privacy officers", async () => {
    const queue = {
      items: [{ ...request, details: "Corregir correo personal", subject: { id: "subject-1", name: "Ada UCN", email: "ada@ucn.cl" } }],
      total: 1,
      page: 1,
      pageSize: 20,
      totalPages: 1,
    };
    vi.mocked(apiFetch)
      .mockResolvedValueOnce([] as never)
      .mockResolvedValueOnce(queue as never);
    renderAs(<DataRightsRequests />, ["PRIVACY_OFFICER"]);

    expect(await screen.findByText("Bandeja de gestión")).toBeDefined();
    expect(await screen.findByText("ada@ucn.cl")).toBeDefined();
    expect(await screen.findByText("Solicitud: Corregir correo personal")).toBeDefined();
    expect(apiFetch).toHaveBeenCalledWith("/privacy/requests/queue?page=1&pageSize=20");
  });

  it("allows a privacy officer to record a one-time deadline extension", async () => {
    const queue = {
      items: [{ ...request, subject: { id: "subject-1", name: "Ada UCN", email: "ada@ucn.cl" } }],
      total: 1,
      page: 1,
      pageSize: 20,
      totalPages: 1,
    };
    vi.mocked(apiFetch)
      .mockResolvedValueOnce([] as never)
      .mockResolvedValueOnce(queue as never)
      .mockResolvedValueOnce({ ...request, extendedAt: "2026-11-15T00:00:00.000Z" } as never)
      .mockResolvedValueOnce([] as never)
      .mockResolvedValueOnce({ ...queue, items: [{ ...queue.items[0], extendedAt: "2026-11-15T00:00:00.000Z" }] } as never);
    renderAs(<DataRightsRequests />, ["PRIVACY_OFFICER"]);

    fireEvent.change(await screen.findByLabelText("Respuesta o fundamento de prórroga"), {
      target: { value: "Complejidad del caso" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Prorrogar 30 días" }));

    await waitFor(() => {
      expect(apiFetch).toHaveBeenCalledWith("/privacy/requests/request-1/extend-deadline", {
        method: "PATCH",
        body: JSON.stringify({ note: "Complejidad del caso" }),
      });
    });
  });
});
