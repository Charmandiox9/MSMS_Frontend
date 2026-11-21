import { fireEvent, screen, waitFor, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { renderAs } from "@/test/render";
import { installFakeApi, ok, fail } from "@/test/fake-api";
import type { Student } from "@/types/students";
import StudentsPage from "./StudentsPage";
import StudentDialog from "./StudentDialog";
import ImportStudentsDialog from "./ImportStudentsDialog";

vi.mock("sonner", () => ({ toast: { promise: vi.fn(), success: vi.fn() } }));
const semester = { id: "semester", name: "2026-2", isActive: true };
const course = { id: "course", name: "Biología marina", code: null };
const student: Student = {
  id: "student",
  name: "Ana Soto",
  email: "ana@example.com",
  enrollments: [
    {
      id: "enrollment",
      nrc: "10001",
      courseId: course.id,
      semesterId: semester.id,
      course,
      semester,
    },
  ],
};
const catalog = {
  semester,
  courses: [
    {
      nrc: "10001",
      courseId: "course",
      name: "Biología marina",
      code: null,
      teachers: [],
    },
    {
      nrc: "10002",
      courseId: "course-2",
      name: "Oceanografía",
      code: null,
      teachers: [],
    },
  ],
};
const response = {
  items: [student],
  total: 1,
  totalPages: 1,
  page: 1,
  pageSize: 10,
};

describe("Estudiantes", () => {
  beforeEach(() => localStorage.clear());
  afterEach(() => vi.unstubAllGlobals());
  it("muestra las asignaturas y semestres en que el estudiante fue ayudante", async () => {
    installFakeApi({
      "GET /academic/careers/options": ok([]),
      "GET /academic/courses/current": ok(catalog),
      "GET /academic/students": ok({
        ...response,
        items: [
          {
            ...student,
            assistantships: [
              {
                id: "assistantship",
                course,
                semester: { id: "past", name: "2025-2" },
                nrc: null,
                courseNrc: "45678",
                startsOn: "2025-08-01",
                endsOn: "2025-12-31",
              },
            ],
          },
        ],
      }),
    });
    renderAs(<StudentsPage />, ["ACADEMIC_SECRETARY"]);
    expect(
      await screen.findByText("Historial de ayudantías (1)"),
    ).toBeDefined();
    fireEvent.click(screen.getByText("Historial de ayudantías (1)"));
    expect(screen.getByText("Biología marina · 2025-2")).toBeDefined();
    expect(screen.getByText("NRC de asignatura: 45678")).toBeDefined();
  });
  it("distingue a las personas tituladas y muestra su carrera registrada", async () => {
    const graduate: Student = {
      ...student,
      career: { id: "career-bm", code: "BM", name: "Biología Marina" },
      titulationProcesses: [
        {
          id: "graduation-process",
          stage: "UNCLASSIFIED",
          outcome: "GRADUATED",
          careerName: "Biología Marina",
          degree: null,
          defenseDate: null,
          createdAt: "2026-11-18T12:00:00.000Z",
        },
      ],
    };
    installFakeApi({
      "GET /academic/careers/options": ok([]),
      "GET /academic/courses/current": ok(catalog),
      "GET /academic/students": ok({ ...response, items: [graduate] }),
    });

    renderAs(<StudentsPage />, ["ACADEMIC_SECRETARY"]);

    expect(await screen.findByText("Titulado")).toBeDefined();
    expect(screen.getByText("Carrera: Biología Marina")).toBeDefined();
  });
  it("identifica los alumnos sin expediente sin inferir su situación académica", async () => {
    installFakeApi({
      "GET /academic/careers/options": ok([]),
      "GET /academic/courses/current": ok(catalog),
      "GET /academic/students": ok(response),
    });

    renderAs(<StudentsPage />, ["ACADEMIC_SECRETARY"]);

    expect(await screen.findByText("Sin registro de titulación")).toBeDefined();
    expect(screen.getByText("Sin carrera registrada")).toBeDefined();
  });
  it("consulta estudiantes con filtros por NRC, búsqueda y paginación del backend", async () => {
    const api = installFakeApi({
      "GET /academic/careers/options": ok([]),
      "GET /academic/courses/current": ok(catalog),
      "GET /academic/students": ok({ ...response, total: 12, totalPages: 2 }),
    });
    renderAs(<StudentsPage initialNrc="10001" />, ["ACADEMIC_SECRETARY"]);
    await screen.findByText("Ana Soto");
    expect(api.calls("GET /academic/students")[0].query.get("nrc")).toBe(
      "10001",
    );
    fireEvent.click(screen.getByRole("button", { name: "Página siguiente" }));
    await waitFor(() =>
      expect(
        api.calls("GET /academic/students").at(-1)?.query.get("page"),
      ).toBe("2"),
    );
    fireEvent.change(screen.getByLabelText("Buscar por RUT, nombre o correo"), {
      target: { value: "ana" },
    });
    await waitFor(() =>
      expect(
        api.calls("GET /academic/students").at(-1)?.query.get("search"),
      ).toBe("ana"),
    );
    expect(api.calls("GET /academic/students").at(-1)?.query.get("page")).toBe(
      "1",
    );
  });
  it.each([
    "ACADEMIC_PROCESS_ANALYST",
    "TEACHING_SUPPORT_COORDINATOR",
  ] as const)(
    "permite consultar a %s y oculta las acciones de escritura",
    async (role) => {
      installFakeApi({
        "GET /academic/careers/options": ok([]),
        "GET /academic/courses/current": ok(catalog),
        "GET /academic/students": ok(response),
      });
      renderAs(<StudentsPage />, [role]);
      await screen.findByText("Ana Soto");
      expect(
        screen.queryByRole("button", { name: "Crear estudiante" }),
      ).toBeNull();
      expect(screen.queryByRole("button", { name: "Importar CSV" })).toBeNull();
      expect(screen.queryByRole("button", { name: /Editar Ana/ })).toBeNull();
    },
  );
  it("recupera una consulta fallida con reintentar", async () => {
    const api = installFakeApi({
      "GET /academic/careers/options": ok([]),
      "GET /academic/courses/current": ok(catalog),
      "GET /academic/students": fail(500, "No disponible"),
    });
    renderAs(<StudentsPage />, ["ACADEMIC_SECRETARY"]);
    await screen.findByRole("alert");
    api.on("GET /academic/students", ok(response));
    fireEvent.click(screen.getByRole("button", { name: "Reintentar" }));
    expect(await screen.findByText("Ana Soto")).toBeDefined();
  });
  it("expande las asignaturas en la fila y permite volver a contraerlas", async () => {
    installFakeApi({
      "GET /academic/courses/current": ok(catalog),
      "GET /academic/students": ok(response),
    });
    renderAs(<StudentsPage />, ["ACADEMIC_SECRETARY"]);

    const toggle = await screen.findByRole("button", {
      name: "Ver asignaturas de Ana Soto",
    });
    expect(toggle.getAttribute("aria-expanded")).toBe("false");
    fireEvent.click(toggle);

    expect(
      screen.getByRole("heading", { name: "Asignaturas inscritas" }),
    ).toBeDefined();
    expect(
      screen.getByRole("heading", { name: "Biología marina" }),
    ).toBeDefined();
    expect(toggle.getAttribute("aria-expanded")).toBe("true");

    fireEvent.click(toggle);
    expect(toggle.getAttribute("aria-expanded")).toBe("false");
    expect(
      screen.queryByRole("heading", { name: "Biología marina" }),
    ).toBeNull();
  });
  it("muestra los datos del padrón en el detalle sin exponer las matrículas", async () => {
    const extendedStudent: Student = {
      ...student,
      givenNames: "Ana",
      paternalSurname: "Soto",
      maternalSurname: "Paz",
      rut: "12.345.678-5",
      personalEmail: "ana.personal@example.com",
      admission: "202610",
      birthDate: "2000-01-02",
      career: { id: "career", code: "8506", name: "Biología Marina" },
    };
    installFakeApi({
      "GET /academic/courses/current": ok(catalog),
      "GET /academic/students": ok({ ...response, items: [extendedStudent] }),
    });
    renderAs(<StudentsPage />, ["ACADEMIC_SECRETARY"]);

    fireEvent.click(
      await screen.findByRole("button", { name: "Ver detalle de Ana Soto" }),
    );

    const dialog = screen.getByRole("dialog");
    expect(within(dialog).getByText("Ana Soto")).toBeDefined();
    expect(within(dialog).getByText("ana@example.com")).toBeDefined();
    expect(within(dialog).getByText("12.345.678-5")).toBeDefined();
    expect(within(dialog).getByText("ana.personal@example.com")).toBeDefined();
    expect(within(dialog).getByText("Biología Marina")).toBeDefined();
    expect(within(dialog).getByText("2026")).toBeDefined();
    expect(within(dialog).getByText("Primer semestre")).toBeDefined();
    expect(within(dialog).queryByText("Biología marina")).toBeNull();
    expect(within(dialog).queryByText("10001")).toBeNull();
  });

  it("filtra por RUT, carrera y cohorte y envía el orden elegido al backend", async () => {
    const careerId = "career-8506";
    const api = installFakeApi({
      "GET /academic/courses/current": ok(catalog),
      "GET /academic/careers/options": ok([
        {
          id: careerId,
          code: "8506",
          name: "Ingeniería Marina",
          isActive: true,
          curriculumVersions: [{ id: "curriculum", cohortYear: 2026 }],
        },
      ]),
      "GET /academic/students": ok(response),
    });
    renderAs(<StudentsPage />, ["ACADEMIC_SECRETARY"]);
    expect(
      await screen.findByRole("option", {
        name: "Ingeniería Marina · Código: 8506",
      }),
    ).toBeDefined();
    fireEvent.change(
      await screen.findByLabelText("Buscar por RUT, nombre o correo"),
      {
        target: { value: "12.345.678-5" },
      },
    );
    fireEvent.change(screen.getByLabelText("Filtrar por carrera"), {
      target: { value: careerId },
    });
    fireEvent.change(screen.getByLabelText("Filtrar por cohorte de ingreso"), {
      target: { value: "2026" },
    });
    fireEvent.change(screen.getByLabelText("Ordenar por"), {
      target: { value: "surname" },
    });
    fireEvent.change(screen.getByLabelText("Dirección"), {
      target: { value: "desc" },
    });
    await waitFor(() => {
      const query = api.calls("GET /academic/students").at(-1)?.query;
      expect(query?.get("search")).toBe("12.345.678-5");
      expect(query?.get("careerId")).toBe(careerId);
      expect(query?.get("cohortYear")).toBe("2026");
      expect(query?.get("sortBy")).toBe("surname");
      expect(query?.get("sortOrder")).toBe("desc");
    });
  });
  it("crea el perfil manual y vincula un NRC seleccionado", async () => {
    const api = installFakeApi({
      "GET /academic/careers/options": ok([]),
      "GET /academic/courses/current": ok(catalog),
      "POST /academic/students": ok(student),
    });
    const saved = vi.fn();
    renderAs(
      <StudentDialog
        student={null}
        initialNrc="10001"
        onSaved={saved}
        onClose={vi.fn()}
      />,
    );
    const selected = await screen.findByLabelText(/Biología marina/);
    expect(selected).toHaveProperty("checked", true);
    fireEvent.change(screen.getByLabelText("Nombre(s)"), {
      target: { value: "Ana Soto" },
    });
    fireEvent.change(screen.getByLabelText("Correo electrónico"), {
      target: { value: "ana@example.com" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Guardar estudiante" }));
    await waitFor(() => expect(saved).toHaveBeenCalledOnce());
    expect(api.calls("POST /academic/students")[0].body).toEqual({
      careerCurriculumVersionId: null,
      careerId: null,
      givenNames: "Ana Soto",
      name: "Ana Soto",
      email: "ana@example.com",
      rut: null,
      personalEmail: null,
      admission: null,
      paternalSurname: null,
      maternalSurname: null,
      birthDate: null,
      semesterId: "semester",
      nrcs: ["10001"],
    });
  });
  it("consulta la matrícula actual al editar y permite sustituir vínculos", async () => {
    const api = installFakeApi({
      "GET /academic/careers/options": ok([]),
      "GET /academic/courses/current": ok(catalog),
      "GET /academic/students/student": ok(student),
      "PATCH /academic/students/student": ok(student),
    });
    renderAs(
      <StudentDialog student={student} onSaved={vi.fn()} onClose={vi.fn()} />,
    );
    const linked = await screen.findByLabelText(/Biología marina/);
    expect(linked).toHaveProperty("checked", true);
    fireEvent.click(linked);
    fireEvent.click(screen.getByLabelText(/Oceanografía/));
    fireEvent.click(screen.getByRole("button", { name: "Guardar estudiante" }));
    await waitFor(() =>
      expect(api.calls("PATCH /academic/students/student")).toHaveLength(1),
    );
    expect(api.calls("PATCH /academic/students/student")[0].body).toMatchObject(
      { semesterId: "semester", nrcs: ["10002"] },
    );
  });
  it("formatea el RUT chileno y explica el código de admisión al editar", async () => {
    installFakeApi({
      "GET /academic/careers/options": ok([]),
      "GET /academic/courses/current": ok(catalog),
      "GET /academic/students/student": ok({ ...student, rut: "214933985", admission: "202610" }),
    });
    renderAs(<StudentDialog student={student} onSaved={vi.fn()} onClose={vi.fn()} />);
    const rut = await screen.findByLabelText("RUT");
    expect((rut as HTMLInputElement).value).toBe("21.493.398-5");
    fireEvent.change(rut, { target: { value: "19999999k" } });
    expect((rut as HTMLInputElement).value).toBe("19.999.999-K");
    expect((screen.getByLabelText(/Admisión \(AAAASS\)/) as HTMLInputElement).value).toBe("202610");
    expect(screen.getByText(/202610 = primer semestre de 2026; 202620 = segundo semestre de 2026/)).toBeDefined();
  });
  it("muestra solo las mallas de la carrera seleccionada y prioriza el cohorte de admisión", async () => {
    const careers = [
      {
        id: "career-a",
        code: "8506",
        name: "Ingeniería Marina",
        isActive: true,
        curriculumVersions: [
          {
            id: "curriculum-2025",
            cohortYear: 2025,
            cohorts: [{ cohortYear: 2025 }, { cohortYear: 2027 }],
          },
          { id: "curriculum-2026", cohortYear: 2026 },
        ],
      },
      {
        id: "career-b",
        code: "8507",
        name: "Biología Marina",
        isActive: true,
        curriculumVersions: [{ id: "other-curriculum", cohortYear: 2025 }],
      },
    ];
    installFakeApi({
      "GET /academic/careers/options": ok(careers),
      "GET /academic/courses/current": ok(catalog),
      "POST /academic/students": ok(student),
    });
    renderAs(
      <StudentDialog student={null} onSaved={vi.fn()} onClose={vi.fn()} />,
    );
    const career = await screen.findByLabelText("Carrera y malla");
    fireEvent.change(career, { target: { value: "career-a" } });
    fireEvent.change(screen.getByLabelText(/Admisión \(AAAASS\)/), {
      target: { value: "202510" },
    });
    const curriculum = screen.getByLabelText(
      "Malla curricular (opcional)",
    ) as HTMLSelectElement;
    expect(curriculum.value).toBe("curriculum-2025");
    expect(
      within(curriculum).getByRole("option", { name: "Cohorte 2025" }),
    ).toBeDefined();
    expect(
      within(curriculum).queryByRole("option", { name: "Cohorte 2026" }),
    ).toBeNull();
    expect(
      within(curriculum).queryByRole("option", { name: /Biología Marina/ }),
    ).toBeNull();
    fireEvent.change(screen.getByLabelText(/Admisión \(AAAASS\)/), {
      target: { value: "202710" },
    });
    expect(curriculum.value).toBe("curriculum-2025");
    expect(within(curriculum).getByRole("option", { name: "Plan 2025" })).toBeDefined();
  });
  it("permite crear el perfil sin semestre y no envía matrículas", async () => {
    const api = installFakeApi({
      "GET /academic/careers/options": ok([]),
      "GET /academic/courses/current": ok({ semester: null, courses: [] }),
      "POST /academic/students": ok(student),
    });
    renderAs(
      <StudentDialog student={null} onSaved={vi.fn()} onClose={vi.fn()} />,
    );
    await screen.findByText(/No hay semestre activo/);
    fireEvent.change(screen.getByLabelText("Nombre(s)"), {
      target: { value: "Ana Soto" },
    });
    fireEvent.change(screen.getByLabelText("Correo electrónico"), {
      target: { value: "ana@example.com" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Guardar estudiante" }));
    await waitFor(() =>
      expect(api.calls("POST /academic/students")).toHaveLength(1),
    );
    expect(api.calls("POST /academic/students")[0].body).toEqual({
      careerCurriculumVersionId: null,
      careerId: null,
      givenNames: "Ana Soto",
      name: "Ana Soto",
      email: "ana@example.com",
      rut: null,
      personalEmail: null,
      admission: null,
      paternalSurname: null,
      maternalSurname: null,
      birthDate: null,
    });
  });
  it("envía el CSV y el semestre visible y comunica los resultados", async () => {
    const api = installFakeApi({
      "GET /academic/careers/options": ok([]),
      "GET /academic/courses/current": ok(catalog),
      "POST /academic/students/import-csv": ok({
        importedStudents: 1,
        createdStudents: 1,
        addedEnrollments: 1,
        semesterId: "semester",
      }),
    });
    const saved = vi.fn();
    renderAs(<ImportStudentsDialog onSaved={saved} onClose={vi.fn()} />);
    const input = await screen.findByLabelText("Archivo CSV");
    const csv = "nombre;correo;nrc1\nAna Soto;ana@example.com;10001";
    fireEvent.change(input, {
      target: {
        files: [new File([csv], "estudiantes.csv", { type: "text/csv" })],
      },
    });
    fireEvent.click(screen.getByRole("button", { name: "Importar CSV" }));
    await waitFor(() => expect(saved).toHaveBeenCalledOnce());
    expect(api.calls("POST /academic/students/import-csv")[0].body).toEqual({
      csv,
      semesterId: "semester",
    });
  });
  it("mantiene el formulario abierto al rechazar un NRC del CSV", async () => {
    installFakeApi({
      "GET /academic/careers/options": ok([]),
      "GET /academic/courses/current": ok(catalog),
      "POST /academic/students/import-csv": fail(
        400,
        "Fila 2: NRC inexistente",
      ),
    });
    const saved = vi.fn();
    renderAs(<ImportStudentsDialog onSaved={saved} onClose={vi.fn()} />);
    fireEvent.change(await screen.findByLabelText("Archivo CSV"), {
      target: { files: [new File(["x"], "estudiantes.csv")] },
    });
    fireEvent.click(screen.getByRole("button", { name: "Importar CSV" }));
    expect(await screen.findByRole("alert")).toHaveProperty(
      "textContent",
      "No fue posible importar los estudiantes.",
    );
    expect(saved).not.toHaveBeenCalled();
  });
  it("permite importar el padrón de estudiantes sin semestre activo", async () => {
    const api = installFakeApi({
      "GET /academic/careers/options": ok([]),
      "GET /academic/courses/current": ok({ semester: null, courses: [] }),
      "POST /academic/students/import-csv": ok({
        importedStudents: 1,
        createdStudents: 1,
        addedEnrollments: 0,
        semesterId: null,
      }),
    });
    renderAs(<ImportStudentsDialog onSaved={vi.fn()} onClose={vi.fn()} />);
    fireEvent.change(await screen.findByLabelText("Archivo CSV"), {
      target: {
        files: [
          new File(
            [
              [
                "codigo_carrera;carrera;ADMISION;RUT;NOMBRE;AP_PATERNO;AP_MATERNO;EMAIL_ESTUDIANTE",
                "8506;Biología Marina;202610;12345678-9;Ana;Soto;Paz;ana@example.com",
              ].join("\n"),
            ],
            "estudiantes.csv",
            { type: "text/csv" },
          ),
        ],
      },
    });
    fireEvent.click(screen.getByRole("button", { name: "Importar CSV" }));
    await waitFor(() =>
      expect(api.calls("POST /academic/students/import-csv")).toHaveLength(1),
    );
    expect(
      api.calls("POST /academic/students/import-csv")[0].body,
    ).not.toHaveProperty("semesterId");
  });
});
