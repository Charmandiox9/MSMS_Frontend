import { fireEvent, screen } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import { installFakeApi, ok } from "@/test/fake-api";
import { renderAs } from "@/test/render";
import AssistantshipApplicationsDialog from "./AssistantshipApplicationsDialog";
import { applicationEndpoint, type ApplicationDetail } from "../applications";

vi.mock("sonner", () => ({ toast: { promise: vi.fn() } }));
afterEach(() => vi.unstubAllGlobals());

const application: ApplicationDetail = {
  id: "app-1",
  name: "Persona de prueba",
  studentEmail: "student@example.test",
  submittedAt: "2026-11-19T12:00:00.000Z",
  status: "PENDING",
  studentId: "student-1",
  student: {
    id: "student-1",
    name: "Ficha existente",
    email: "student@example.test",
    career: null,
  },
  assistantshipId: null,
  rut: "12.345.678-5",
  phone: "+56 9 1234 5678",
  submittedCareer: "Programa de prueba",
  address: "Dirección ficticia",
  subject: "Oceanografía",
  motivation: "Acompañar a estudiantes nuevos.",
  ppa: "5,80",
  reviewedAt: null,
  reviewNote: null,
  notification: "NOT_REQUESTED",
};

it.each([
  {
    decision: "APPROVED",
    notify: true,
    message: "Pendiente de completar horario",
  },
  { decision: "REJECTED", notify: false, message: "Rechazada" },
] as const)(
  "reviews the submitted details and decides $decision",
  async ({ decision, notify, message }) => {
    const saved = {
      ...application,
      status: decision,
      notification: notify ? "SENT" : "NOT_REQUESTED",
    };
    const api = installFakeApi({
      [`GET ${applicationEndpoint}`]: ok({
        items: [application],
        hasMore: false,
      }),
      [`GET ${applicationEndpoint}/app-1`]: ok(application),
      [`PATCH ${applicationEndpoint}/app-1/decision`]: ok(saved),
    });
    const onComplete = vi.fn();
    renderAs(
      <AssistantshipApplicationsDialog
        onClose={vi.fn()}
        onComplete={onComplete}
        canComplete
      />,
      ["TEACHING_SUPPORT_COORDINATOR"],
    );
    fireEvent.click(
      await screen.findByRole("button", { name: /Persona de prueba/ }),
    );

    expect(await screen.findByText("Dirección ficticia")).toBeDefined();
    expect(screen.getByText("5,80")).toBeDefined();
    expect(
      screen
        .getByRole("link", { name: "Ver ficha y avance curricular" })
        .getAttribute("href"),
    ).toContain("/dashboard/students/student-1/progress");
    fireEvent.change(screen.getByLabelText("Decisión"), {
      target: { value: decision },
    });
    const checkbox = screen.getByRole<HTMLInputElement>("checkbox", {
      name: "Notificar al estudiante por correo",
    });
    expect(checkbox.checked).toBe(false);
    if (notify) fireEvent.click(checkbox);
    fireEvent.click(screen.getByRole("button", { name: "Guardar decisión" }));

    expect(await screen.findByText(new RegExp(message))).toBeDefined();
    expect(
      api.calls(`PATCH ${applicationEndpoint}/app-1/decision`)[0].body,
    ).toMatchObject({ status: decision, notify });
    if (decision === "APPROVED") {
      fireEvent.click(
        screen.getByRole("button", { name: "Completar ayudantía" }),
      );
      expect(onComplete).toHaveBeenCalledWith(saved);
    } else {
      expect(
        screen.queryByRole("button", { name: "Completar ayudantía" }),
      ).toBeNull();
    }
  },
);
