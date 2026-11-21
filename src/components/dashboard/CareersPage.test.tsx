import { fireEvent, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { renderAs } from "@/test/render";
import { installFakeApi, ok } from "@/test/fake-api";
import CareersPage from "./CareersPage";

vi.mock("sonner", () => ({ toast: { promise: vi.fn() } }));

const course = {
  id: "33333333-3333-4333-8333-333333333333",
  code: "BM101",
  name: "Biología marina",
};
const department = { id: "department", name: "Oceanografía" };

describe("CareersPage", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("muestra las mallas de cohorte agrupadas por semestre", async () => {
    installFakeApi({
      "GET /academic/careers": ok([
        {
          id: "career",
          code: "BIO-MAR",
          name: "Biología Marina",
          isActive: true,
          curriculumVersions: [
            {
              id: "curriculum",
              cohortYear: 2024,
              _count: { students: 1 },
              courses: [
                {
                  id: "curriculum-course",
                  courseId: course.id,
                  termNumber: 1,
                  course,
                },
              ],
            },
          ],
        },
      ]),
    });

    renderAs(<CareersPage />, ["ACADEMIC_PROCESS_ANALYST"]);

    expect(await screen.findByText("Biología Marina")).toBeDefined();
    expect(screen.getByText("Cohorte 2024")).toBeDefined();
    expect(screen.getByText("1 estudiante")).toBeDefined();
    fireEvent.click(screen.getByRole("button", { name: "Ver malla" }));
    expect(screen.getByRole("dialog")).toBeDefined();
    expect(screen.getByText("Biología marina")).toBeDefined();
    expect(screen.queryByRole("button", { name: "Crear carrera" })).toBeNull();
  });

  it("confirma la eliminación y conserva el identificador de concurrencia", async () => {
    const updatedAt = "2026-11-11T12:00:00.000Z";
    const api = installFakeApi({
      "GET /academic/careers": ok([
        {
          id: "career",
          code: "BIO",
          name: "Biología",
          isActive: true,
          updatedAt,
          curriculumVersions: [],
        },
      ]),
      "GET /academic/careers/course-options": ok([]),
      "DELETE /academic/careers/career": ok({ deleted: true }),
    });
    renderAs(<CareersPage />, ["ACADEMIC_SECRETARY"]);
    fireEvent.click(
      await screen.findByRole("button", { name: "Eliminar Biología" }),
    );
    expect(api.calls("DELETE /academic/careers/career")).toHaveLength(0);
    fireEvent.click(screen.getByRole("button", { name: "Eliminar carrera" }));
    await waitFor(() =>
      expect(api.calls("DELETE /academic/careers/career")[0].body).toEqual({
        updatedAt,
      }),
    );
  });

  it("permite revisar una malla existente antes de registrar otra cohorte", async () => {
    const api = installFakeApi({
      "GET /academic/careers": ok([{
        id: "career",
        name: "Biología Marina",
        isActive: true,
        curriculumVersions: [{
          id: "plan-2024",
          cohortYear: 2024,
          courses: [{ id: "entry", courseId: course.id, termNumber: 2, course }],
          _count: { students: 1 },
        }],
      }]),
      "GET /academic/careers/course-options": ok([course]),
      "POST /academic/careers/career/curricula": ok({ id: "plan-2024" }),
    });
    renderAs(<CareersPage />, ["ACADEMIC_SECRETARY"]);
    fireEvent.click(await screen.findByRole("button", { name: "Registrar cohorte" }));
    fireEvent.change(screen.getByLabelText("Año de ingreso de la cohorte"), {
      target: { value: "2027" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Usar malla existente" }));
    const save = screen.getByRole<HTMLButtonElement>("button", { name: "Guardar" });
    expect(save.disabled).toBe(true);
    fireEvent.change(screen.getByLabelText("Malla existente"), {
      target: { value: "plan-2024" },
    });
    expect(screen.getByText("Vista previa del Plan 2024 · 1 asignatura")).toBeDefined();
    expect(screen.getByRole("heading", { name: "Semestre 2" })).toBeDefined();
    expect(screen.getByText(course.name)).toBeDefined();
    fireEvent.click(save);
    await waitFor(() => expect(api.calls("POST /academic/careers/career/curricula")[0].body)
      .toEqual({ cohortYear: 2027, existingVersionId: "plan-2024" }));
  });

  it("agrega una asignatura al catálogo al guardar la primera malla manual", async () => {
    const api = installFakeApi({
      "GET /academic/careers": ok([]),
      "GET /academic/careers/course-options": ok([]),
      "GET /academic/departments/options": ok([]),
      "POST /academic/careers": ok({ id: "career" }),
    });
    renderAs(<CareersPage />, ["ACADEMIC_SECRETARY"]);
    fireEvent.click(await screen.findByRole("button", { name: "Crear carrera" }));
    fireEvent.change(screen.getByLabelText("Nombre de la carrera"), {
      target: { value: "Biología Marina" },
    });
    fireEvent.change(screen.getByLabelText("Asignatura"), { target: { value: "new" } });
    fireEvent.change(screen.getByRole("textbox", { name: /Nombre de la asignatura/ }), {
      target: { value: "  Oceanografía  " },
    });
    fireEvent.change(screen.getByLabelText("Semestre"), { target: { value: "3" } });
    fireEvent.click(screen.getByRole("button", { name: "Agregar" }));
    expect(screen.getByText("Oceanografía")).toBeDefined();
    expect(api.calls("POST /academic/careers")).toHaveLength(0);
    fireEvent.click(screen.getByRole("button", { name: "Guardar" }));
    await waitFor(() => expect(api.calls("POST /academic/careers")[0].body)
      .toMatchObject({ newCourses: [{ courseName: "Oceanografía", termNumber: 3 }] }));
  });

  it("crea una carrera con sus asignaturas ubicadas en una cohorte", async () => {
    const api = installFakeApi({
      "GET /academic/careers": ok([]),
      "GET /academic/careers/course-options": ok([course]),
      "GET /academic/departments/options": ok([department]),
      "POST /academic/careers": ok({ id: "career" }),
    });

    renderAs(<CareersPage />, ["ACADEMIC_SECRETARY"]);
    fireEvent.click(
      await screen.findByRole("button", { name: "Crear carrera" }),
    );
    fireEvent.change(screen.getByLabelText("Código"), {
      target: { value: "BIO-MAR" },
    });
    fireEvent.change(screen.getByLabelText("Nombre de la carrera"), {
      target: { value: "Biología Marina" },
    });
    await screen.findByRole("option", { name: department.name });
    fireEvent.change(screen.getByLabelText("Departamento"), {
      target: { value: department.id },
    });
    fireEvent.change(screen.getByRole("combobox", { name: "Asignatura" }), {
      target: { value: course.id },
    });
    fireEvent.click(screen.getByRole("button", { name: "Agregar" }));
    fireEvent.click(screen.getByRole("button", { name: "Guardar" }));

    await waitFor(() =>
      expect(api.calls("POST /academic/careers")).toHaveLength(1),
    );
    expect(api.calls("POST /academic/careers")[0].body).toMatchObject({
      code: "BIO-MAR",
      name: "Biología Marina",
      departmentId: department.id,
      courses: [{ courseId: course.id, termNumber: 1 }],
    });
  });

  it("crea la primera malla importando un CSV dentro de la misma operación", async () => {
    const api = installFakeApi({
      "GET /academic/careers": ok([]),
      "GET /academic/careers/course-options": ok([course]),
      "GET /academic/departments/options": ok([department]),
      "POST /academic/imports/careers/commit": ok({
        id: "job-id",
        status: "QUEUED",
      }),
      "GET /academic/imports/jobs/job-id": ok({
        id: "job-id",
        status: "PROCESSING",
      }),
    });

    renderAs(<CareersPage />, ["ACADEMIC_SECRETARY"]);
    fireEvent.click(
      await screen.findByRole("button", { name: "Crear carrera" }),
    );
    fireEvent.change(screen.getByLabelText("Código"), {
      target: { value: "BIO-MAR" },
    });
    fireEvent.change(screen.getByLabelText("Nombre de la carrera"), {
      target: { value: "Biología Marina" },
    });
    await screen.findByRole("option", { name: department.name });
    fireEvent.change(screen.getByLabelText("Departamento"), {
      target: { value: department.id },
    });
    fireEvent.click(screen.getByRole("button", { name: "Importar desde CSV" }));
    const file = new File(
      ["nombre_asignatura,semestre\nBiología marina,1"],
      "malla.csv",
      { type: "text/csv" },
    );
    fireEvent.change(screen.getByLabelText("Archivo CSV"), {
      target: { files: [file] },
    });

    expect(
      await screen.findByText("malla.csv · 1 asignaturas detectadas"),
    ).toBeDefined();
    fireEvent.click(screen.getByRole("button", { name: "Guardar" }));

    await waitFor(() =>
      expect(api.calls("POST /academic/imports/careers/commit")).toHaveLength(
        1,
      ),
    );
    expect(
      api.calls("POST /academic/imports/careers/commit")[0].body,
    ).toMatchObject({
      code: "BIO-MAR",
      name: "Biología Marina",
      departmentId: department.id,
      cohortYear: new Date().getFullYear(),
      courses: [{ courseName: "Biología marina", termNumber: 1 }],
    });
  });
});
