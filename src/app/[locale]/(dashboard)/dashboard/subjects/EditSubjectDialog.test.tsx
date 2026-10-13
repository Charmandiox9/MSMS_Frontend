import { fireEvent, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderAs } from "@/test/render";
import { fail, installFakeApi, ok } from "@/test/fake-api";
import EditSubjectDialog from "./EditSubjectDialog";

vi.mock("sonner", () => ({ toast: { promise: vi.fn() } }));
const options = {
  days: ["Lunes", "Miércoles"],
  blocks: [
    { code: "A", startsAtMinute: 490, endsAtMinute: 580 },
    { code: "B", startsAtMinute: 595, endsAtMinute: 685 },
  ],
};
const subject = {
  nrc: "10001",
  name: "Estructura de Datos",
  entries: [
    { day: "Lunes", block: "A", location: "Sala 1", course: { code: "ED" } },
    {
      day: "Miércoles",
      block: "A",
      location: "Sala 2",
      course: { code: "ED" },
    },
    {
      day: "Lunes",
      block: "B",
      kind: "ASSISTANTSHIP",
      location: "Sala ayudantía",
      course: { code: "ED" },
    },
  ],
};
describe("Editor de asignaturas", () => {
  it("guarda sin código y no lo rellena con el NRC", async () => {
    const api = installFakeApi({
      "GET /academic/courses/options": ok(options),
      "PATCH /academic/courses/10001": ok({ nrc: "10001" }),
    });
    renderAs(
      <EditSubjectDialog
        subject={{
          ...subject,
          entries: subject.entries.map((entry) => ({
            ...entry,
            course: { code: null },
          })),
        }}
        onSaved={vi.fn()}
        onClose={vi.fn()}
      />,
      ["SYSTEM_ADMIN"],
    );
    await screen.findAllByLabelText("Sala");
    const code = screen.getByLabelText(
      "Código de asignatura (opcional)",
    ) as HTMLInputElement;
    expect(code.value).toBe("");
    expect(code.required).toBe(false);
    fireEvent.click(screen.getByRole("button", { name: "Guardar cambios" }));
    await waitFor(() =>
      expect(api.calls("PATCH /academic/courses/10001")).toHaveLength(1),
    );
    expect(api.calls("PATCH /academic/courses/10001")[0].body).toMatchObject({
      code: null,
      nrc: "10001",
    });
  });
  beforeEach(() => {
    localStorage.clear();
  });
  it("guarda los horarios con salas independientes, excluyendo las ayudantías", async () => {
    const api = installFakeApi({
      "GET /academic/courses/options": ok(options),
      "PATCH /academic/courses/10001": ok({ nrc: "20001" }),
    });
    const saved = vi.fn();
    renderAs(
      <EditSubjectDialog subject={subject} onSaved={saved} onClose={vi.fn()} />,
      ["SYSTEM_ADMIN"],
    );
    const rooms = await screen.findAllByLabelText("Sala");
    expect(rooms).toHaveLength(2);
    fireEvent.change(rooms[1], { target: { value: "Laboratorio 3" } });
    fireEvent.change(screen.getByLabelText("NRC"), {
      target: { value: "20001" },
    });
    fireEvent.change(screen.getAllByLabelText("Bloque")[1], {
      target: { value: "B" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Guardar cambios" }));
    await waitFor(() => expect(saved).toHaveBeenCalledWith("20001"));
    expect(api.calls("PATCH /academic/courses/10001")[0].body).toEqual({
      name: subject.name,
      code: "ED",
      nrc: "20001",
      schedules: [
        { day: "Lunes", block: "A", location: "Sala 1" },
        { day: "Miércoles", block: "B", location: "Laboratorio 3" },
      ],
    });
  });
  it("permite añadir y quitar horarios", async () => {
    installFakeApi({ "GET /academic/courses/options": ok(options) });
    renderAs(
      <EditSubjectDialog
        subject={subject}
        onSaved={vi.fn()}
        onClose={vi.fn()}
      />,
      ["ACADEMIC_SECRETARY"],
    );
    await screen.findAllByLabelText("Sala");
    fireEvent.click(screen.getByRole("button", { name: "Añadir horario" }));
    expect(screen.getAllByLabelText("Sala")).toHaveLength(3);
    fireEvent.click(screen.getByRole("button", { name: "Eliminar horario 2" }));
    expect(screen.getAllByLabelText("Sala")).toHaveLength(2);
  });
  it("rechaza horarios duplicados sin enviar una petición", async () => {
    const api = installFakeApi({
      "GET /academic/courses/options": ok(options),
    });
    renderAs(
      <EditSubjectDialog
        subject={subject}
        onSaved={vi.fn()}
        onClose={vi.fn()}
      />,
      ["SYSTEM_ADMIN"],
    );
    await screen.findAllByLabelText("Sala");
    fireEvent.change(screen.getAllByLabelText("Día")[1], {
      target: { value: "Lunes" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Guardar cambios" }));
    expect((await screen.findByRole("alert")).textContent).toContain(
      "No puedes repetir",
    );
    expect(api.calls("PATCH /academic/courses/10001")).toHaveLength(0);
  });
  it("conserva el formulario cuando falla el guardado", async () => {
    installFakeApi({
      "GET /academic/courses/options": ok(options),
      "PATCH /academic/courses/10001": fail(409, "El NRC ya existe"),
    });
    const saved = vi.fn();
    renderAs(
      <EditSubjectDialog subject={subject} onSaved={saved} onClose={vi.fn()} />,
      ["SYSTEM_ADMIN"],
    );
    await screen.findAllByLabelText("Sala");
    fireEvent.click(screen.getByRole("button", { name: "Guardar cambios" }));
    expect((await screen.findByRole("alert")).textContent).toContain(
      "El NRC ya existe",
    );
    expect(saved).not.toHaveBeenCalled();
    expect(
      (screen.getAllByLabelText("Sala")[0] as HTMLInputElement).value,
    ).toBe("Sala 1");
  });
  it("permite reintentar la carga de bloques", async () => {
    const api = installFakeApi({
      "GET /academic/courses/options": fail(500, "Error al cargar"),
    });
    renderAs(
      <EditSubjectDialog
        subject={subject}
        onSaved={vi.fn()}
        onClose={vi.fn()}
      />,
      ["SYSTEM_ADMIN"],
    );
    await screen.findByRole("alert");
    api.on("GET /academic/courses/options", ok(options));
    fireEvent.click(screen.getByRole("button", { name: "Reintentar" }));
    expect(await screen.findAllByLabelText("Sala")).toHaveLength(2);
  });
});
