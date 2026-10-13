import { expect, loginAs, test } from "./support";

test.beforeEach(async ({ page }) => {
  const semester = { id: "semester", name: "2026-2", isActive: true };
  const courses = [
    { id: "course-1", nrc: "10001", name: "Biología marina", code: "BM" },
    { id: "course-2", nrc: "10002", name: "Oceanografía", code: null },
  ];
  const students = [
    {
      id: "student-1",
      name: "Ana Soto",
      email: "ana@example.com",
      nrcs: ["10001"],
    },
  ];
  const response = (student: (typeof students)[number]) => ({
    ...student,
    enrollments: student.nrcs.map((nrc) => ({
      id: `${student.id}-${nrc}`,
      studentId: student.id,
      courseId: courses.find((course) => course.nrc === nrc)!.id,
      semesterId: semester.id,
      nrc,
      semester,
      course: courses.find((course) => course.nrc === nrc),
    })),
  });
  await page.route("**/api/academic/**", async (route) => {
    const request = route.request();
    if (request.method() === "OPTIONS") {
      await route.continue();
      return;
    }
    const url = new URL(request.url());
    const path = url.pathname.replace("/api/academic/", "");
    let body: unknown;
    let status = 200;
    if (request.method() === "GET" && path === "courses/current")
      body = {
        semester,
        courses: courses.map((course) => ({
          ...course,
          courseId: course.id,
          teachers: [],
        })),
      };
    else if (request.method() === "GET" && path === "courses")
      body = courses.map((course) => ({
        id: `schedule-${course.id}`,
        course,
        semester,
        nrc: course.nrc,
        day: "Lunes",
        block: "A",
      }));
    else if (request.method() === "GET" && path === "teachers")
      body = { items: [], total: 0, page: 1, pageSize: 100, totalPages: 0 };
    else if (request.method() === "GET" && path === "students") {
      const nrc = url.searchParams.get("nrc");
      const search = url.searchParams.get("search")?.toLowerCase() ?? "";
      const items = students
        .filter(
          (student) =>
            (!nrc || student.nrcs.includes(nrc)) &&
            `${student.name} ${student.email}`.toLowerCase().includes(search),
        )
        .map(response);
      body = {
        items,
        total: items.length,
        page: 1,
        pageSize: 10,
        totalPages: 1,
      };
    } else if (request.method() === "GET" && path.startsWith("students/"))
      body = response(
        students.find((student) => student.id === path.split("/")[1])!,
      );
    else if (path === "students/import-csv") {
      const input = request.postDataJSON() as { csv: string };
      if (input.csv.includes("99999")) {
        status = 400;
        body = {
          message: "Fila 2: el NRC 99999 no existe en el semestre activo",
        };
      } else {
        let createdStudents = 0;
        let addedEnrollments = 0;
        const rows = input.csv.trim().split("\n").slice(1);
        for (const row of rows) {
          const [name, email, ...nrcs] = row.split(";");
          let student = students.find((item) => item.email === email);
          if (!student) {
            student = {
              id: `student-${students.length + 1}`,
              name,
              email,
              nrcs: [],
            };
            students.push(student);
            createdStudents += 1;
          }
          for (const nrc of nrcs.filter(Boolean))
            if (!student.nrcs.includes(nrc)) {
              student.nrcs.push(nrc);
              addedEnrollments += 1;
            }
        }
        body = {
          importedStudents: rows.length,
          createdStudents,
          addedEnrollments,
          semesterId: semester.id,
        };
      }
    } else {
      const input = request.postDataJSON() as {
        name: string;
        email: string;
        nrcs: string[];
      };
      let student = students.find((item) => item.id === path.split("/")[1]);
      if (student) Object.assign(student, input);
      else {
        student = { id: `student-${students.length + 1}`, ...input };
        students.push(student);
      }
      body = response(student);
    }
    if (!body)
      throw new Error(
        `Unexpected academic request ${request.method()} ${path}`,
      );
    await route.fulfill({ status, json: body });
  });
});

test("crea estudiantes, edita matrícula, importa CSV y consulta por NRC desde asignaturas", async ({
  page,
  context,
}, testInfo) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await loginAs(context, "secretary");
  await page.goto("/dashboard/students");
  await expect(
    page.getByRole("heading", { name: "Ana Soto", exact: true }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Crear estudiante", exact: true })
    .click();
  let dialog = page.getByRole("dialog");
  await dialog.getByLabel("Nombre completo").fill("Pedro Pérez");
  await dialog.getByLabel("Correo electrónico").fill("pedro@example.com");
  await dialog.getByLabel(/Oceanografía/).check();
  await page.screenshot({
    path: testInfo.outputPath("student-form-desktop.png"),
  });
  await dialog.getByRole("button", { name: "Guardar estudiante" }).click();
  await expect(
    page.getByRole("heading", { name: "Pedro Pérez", exact: true }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Editar Pedro Pérez y sus asignaturas" })
    .click();
  dialog = page.getByRole("dialog");
  await expect(dialog.getByLabel(/Oceanografía/)).toBeChecked();
  await dialog.getByLabel(/Oceanografía/).uncheck();
  await dialog.getByLabel(/Biología marina/).check();
  await dialog.getByRole("button", { name: "Guardar estudiante" }).click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  const csv =
    "nombre;correo;nrc1;nrc2\nAna Soto;ana@example.com;10001;10002\nMaría Soto;maria@example.com;10001;";
  for (let attempt = 0; attempt < 2; attempt += 1) {
    await page
      .getByRole("button", { name: "Importar CSV", exact: true })
      .click();
    dialog = page.getByRole("dialog");
    await dialog
      .getByLabel("Archivo CSV")
      .setInputFiles({
        name: "estudiantes.csv",
        mimeType: "text/csv",
        buffer: Buffer.from(csv),
      });
    await dialog
      .getByRole("button", { name: "Importar CSV", exact: true })
      .click();
    await expect(page.getByRole("dialog")).toHaveCount(0);
  }
  await expect(
    page.getByRole("heading", { name: "María Soto", exact: true }),
  ).toBeVisible();
  await expect(page.getByText("3 estudiantes", { exact: true })).toBeVisible();
  await page.screenshot({ path: testInfo.outputPath("students-desktop.png") });
  await page.goto("/dashboard/subjects");
  const biology = page
    .getByRole("listitem")
    .filter({
      has: page.getByRole("heading", { name: "Biología marina", exact: true }),
    });
  await biology.getByRole("link", { name: "Estudiantes", exact: true }).click();
  await expect(page).toHaveURL(/students\?nrc=10001$/);
  await expect(
    page.getByRole("heading", { name: "Pedro Pérez", exact: true }),
  ).toBeVisible();
  await page.getByLabel("Filtrar por asignatura").selectOption("10002");
  await expect(
    page.getByRole("heading", { name: "Ana Soto", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Pedro Pérez", exact: true }),
  ).toHaveCount(0);
  expect(errors).toEqual([]);
});

test("un CSV con NRC inexistente muestra el error y conserva el diálogo", async ({
  page,
  context,
}) => {
  await loginAs(context, "secretary");
  await page.goto("/dashboard/students");
  await page.getByRole("button", { name: "Importar CSV", exact: true }).click();
  const dialog = page.getByRole("dialog");
  await dialog
    .getByLabel("Archivo CSV")
    .setInputFiles({
      name: "bad.csv",
      mimeType: "text/csv",
      buffer: Buffer.from("nombre;correo;nrc\nOtro;otro@example.com;99999"),
    });
  await dialog
    .getByRole("button", { name: "Importar CSV", exact: true })
    .click();
  await expect(dialog.getByRole("alert")).toContainText("NRC 99999");
  await expect(dialog).toBeVisible();
});

test("móvil y modo oscuro, y acceso de solo consulta para analistas", async ({
  page,
  context,
}, testInfo) => {
  await loginAs(context, "secretary");
  await context.addInitScript(() => localStorage.setItem("theme", "dark"));
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/dashboard/students");
  await page
    .getByRole("button", { name: "Crear estudiante", exact: true })
    .click();
  await expect(
    page.getByRole("dialog").getByLabel(/Biología marina/),
  ).toBeVisible();
  await page.screenshot({
    path: testInfo.outputPath("student-mobile-dark.png"),
  });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Cancelar" })
    .click();
  await loginAs(context, "analyst");
  await page.goto("/dashboard/students");
  await expect(
    page.getByRole("heading", { name: "Ana Soto", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Crear estudiante", exact: true }),
  ).toHaveCount(0);
  await expect(
    page.getByRole("button", { name: "Importar CSV", exact: true }),
  ).toHaveCount(0);
});
