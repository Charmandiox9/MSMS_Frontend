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
    expect(screen.getByText("Biología marina")).toBeDefined();
    expect(screen.queryByRole("button", { name: "Crear carrera" })).toBeNull();
  });

  it("crea una carrera con sus asignaturas ubicadas en una cohorte", async () => {
    const api = installFakeApi({
      "GET /academic/careers": ok([]),
      "GET /academic/careers/course-options": ok([course]),
      "POST /academic/careers": ok({ id: "career" }),
    });

    renderAs(<CareersPage />, ["ACADEMIC_SECRETARY"]);
    fireEvent.click(await screen.findByRole("button", { name: "Crear carrera" }));
    fireEvent.change(screen.getByLabelText("Código"), {
      target: { value: "BIO-MAR" },
    });
    fireEvent.change(screen.getByLabelText("Nombre de la carrera"), {
      target: { value: "Biología Marina" },
    });
    fireEvent.change(screen.getByRole("combobox"), {
      target: { value: course.id },
    });
    fireEvent.click(screen.getByRole("button", { name: "Agregar" }));
    fireEvent.click(screen.getByRole("button", { name: "Guardar" }));

    await waitFor(() => expect(api.calls("POST /academic/careers")).toHaveLength(1));
    expect(api.calls("POST /academic/careers")[0].body).toMatchObject({
      code: "BIO-MAR",
      name: "Biología Marina",
      courses: [{ courseId: course.id, termNumber: 1 }],
    });
  });

  it("crea la primera malla importando un CSV dentro de la misma operación", async () => {
    const api = installFakeApi({
      "GET /academic/careers": ok([]),
      "GET /academic/careers/course-options": ok([course]),
      "POST /academic/imports/careers/commit": ok({ id: "job-id", status: "QUEUED" }),
      "GET /academic/imports/jobs/job-id": ok({ id: "job-id", status: "PROCESSING" }),
    });

    renderAs(<CareersPage />, ["ACADEMIC_SECRETARY"]);
    fireEvent.click(await screen.findByRole("button", { name: "Crear carrera" }));
    fireEvent.change(screen.getByLabelText("Código"), {
      target: { value: "BIO-MAR" },
    });
    fireEvent.change(screen.getByLabelText("Nombre de la carrera"), {
      target: { value: "Biología Marina" },
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

    expect(await screen.findByText("malla.csv · 1 asignaturas detectadas")).toBeDefined();
    fireEvent.click(screen.getByRole("button", { name: "Guardar" }));

    await waitFor(() => expect(api.calls("POST /academic/imports/careers/commit")).toHaveLength(1));
    expect(api.calls("POST /academic/imports/careers/commit")[0].body).toMatchObject({
      code: "BIO-MAR",
      name: "Biología Marina",
      cohortYear: new Date().getFullYear(),
      courses: [{ courseName: "Biología marina", termNumber: 1 }],
    });
  });
});
