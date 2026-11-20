import { fireEvent, screen, within } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import { installFakeApi, ok } from "@/test/fake-api";
import { renderAs } from "@/test/render";
import AcademicCatalog from "./AcademicCatalog";

const department = {
  id: "department",
  name: "Oceanografía",
  code: "OC",
  description: "Docencia e investigación marina.",
  updatedAt: "2026-11-19T12:00:00.000Z",
  _count: { careers: 0, projects: 0, outputs: 0 },
};

afterEach(() => vi.unstubAllGlobals());

it("creates, edits and confirms deletion from the departments section", async () => {
  let current: typeof department | null = null;
  const renamed = {
    ...department,
    name: "Ciencias del Mar",
    updatedAt: "2026-11-19T13:00:00.000Z",
  };
  const api = installFakeApi({
    "GET /academic/careers": ok([]),
    "GET /academic/careers/course-options": ok([]),
    "GET /academic/departments": () => ({ body: current ? [current] : [] }),
    "POST /academic/departments": () => {
      current = department;
      return { body: current };
    },
    "PUT /academic/departments/department": () => {
      current = renamed;
      return { body: current };
    },
    "DELETE /academic/departments/department": () => {
      current = null;
      return { body: { deleted: true } };
    },
  });
  renderAs(<AcademicCatalog />, ["ACADEMIC_SECRETARY"]);
  expect(
    screen.getByRole("heading", { name: "Departamentos & Carreras" }),
  ).toBeDefined();
  fireEvent.click(screen.getByRole("button", { name: "Departamentos" }));
  expect(
    await screen.findByText("Aún no hay departamentos registrados."),
  ).toBeDefined();

  fireEvent.click(screen.getByRole("button", { name: "Crear departamento" }));
  fireEvent.change(screen.getByLabelText("Nombre del departamento"), {
    target: { value: department.name },
  });
  fireEvent.change(screen.getByLabelText("Código (opcional)"), {
    target: { value: department.code },
  });
  fireEvent.change(screen.getByLabelText("Descripción (opcional)"), {
    target: { value: department.description },
  });
  fireEvent.click(screen.getByRole("button", { name: "Guardar" }));
  expect(
    await screen.findByRole("heading", { name: department.name }),
  ).toBeDefined();
  expect(api.calls("POST /academic/departments")[0].body).toEqual({
    name: department.name,
    code: department.code,
    description: department.description,
  });

  fireEvent.click(screen.getByRole("button", { name: "Editar Oceanografía" }));
  fireEvent.change(screen.getByLabelText("Nombre del departamento"), {
    target: { value: renamed.name },
  });
  fireEvent.click(screen.getByRole("button", { name: "Guardar" }));
  expect(
    await screen.findByRole("heading", { name: renamed.name }),
  ).toBeDefined();
  expect(
    api.calls("PUT /academic/departments/department")[0].body,
  ).toMatchObject({
    name: renamed.name,
    updatedAt: department.updatedAt,
  });

  fireEvent.click(
    screen.getByRole("button", { name: "Eliminar Ciencias del Mar" }),
  );
  expect(api.calls("DELETE /academic/departments/department")).toHaveLength(0);
  fireEvent.click(
    within(screen.getByRole("dialog")).getByRole("button", {
      name: "Eliminar",
    }),
  );
  expect(
    await screen.findByText("Aún no hay departamentos registrados."),
  ).toBeDefined();
  expect(api.calls("DELETE /academic/departments/department")[0].body).toEqual({
    updatedAt: renamed.updatedAt,
  });
});

it("lets an analyst consult departments without write controls", async () => {
  installFakeApi({
    "GET /academic/careers": ok([]),
    "GET /academic/departments": ok([department]),
  });
  renderAs(<AcademicCatalog />, ["ACADEMIC_PROCESS_ANALYST"]);
  fireEvent.click(screen.getByRole("button", { name: "Departamentos" }));
  expect(
    await screen.findByRole("heading", { name: department.name }),
  ).toBeDefined();
  expect(
    screen.queryByRole("button", { name: "Crear departamento" }),
  ).toBeNull();
  expect(
    screen.queryByRole("button", { name: "Editar Oceanografía" }),
  ).toBeNull();
  expect(
    screen.queryByRole("button", { name: "Eliminar Oceanografía" }),
  ).toBeNull();
});
