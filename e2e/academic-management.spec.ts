import { expect, loginAs, test } from "./support";

test.beforeEach(async ({ page }) => {
  const semester = { id: "semester", name: "2026-2", isActive: true };
  const courses = [
    { id: "course-1", name: "Biología marina", code: "BM", nrc: "10001" },
  ];
  const teachers = [
    {
      id: "teacher-1",
      name: "Ana Soto",
      email: "ana@example.com",
      nrcs: ["10001"],
    },
  ];
  await page.route("**/api/academic/**", async (route) => {
    const req = route.request();
    const path = new URL(req.url()).pathname.replace("/api/academic/", "");
    let body: unknown;
    if (req.method() === "GET") {
      if (path === "teachers") {
        const items = teachers.map((teacher) => ({
          ...teacher,
          assignments: teacher.nrcs.map((nrc) => ({
            id: `${teacher.id}-${nrc}`,
            nrc,
            semester,
            course: courses.find((course) => course.nrc === nrc),
          })),
        }));
        body = {
          items,
          total: items.length,
          page: 1,
          pageSize: 100,
          totalPages: 1,
        };
      } else if (path === "courses/current")
        body = {
          semester,
          courses: courses.map((course) => ({
            ...course,
            courseId: course.id,
            teachers: teachers.filter((teacher) =>
              teacher.nrcs.includes(course.nrc),
            ),
          })),
        };
      else if (path === "courses/options")
        body = {
          days: ["Lunes"],
          blocks: [{ code: "A", startsAtMinute: 490, endsAtMinute: 580 }],
        };
      else if (path === "courses")
        body = courses.map((course) => ({
          id: `schedule-${course.id}`,
          nrc: course.nrc,
          day: "Lunes",
          block: "A",
          course,
          semester,
          kind: "COURSE",
          location: "Sala 1",
        }));
    } else if (req.method() === "POST" && path === "courses") {
      const input = req.postDataJSON() as {
        nrc: string;
        name: string;
        code: string;
      };
      courses.push({ id: `course-${courses.length + 1}`, ...input });
      body = input;
    } else if (req.method() === "PUT") {
      const { teacherIds } = req.postDataJSON() as { teacherIds: string[] };
      const nrc = path.split("/")[1];
      for (const teacher of teachers) {
        teacher.nrcs = teacher.nrcs.filter((value) => value !== nrc);
        if (teacherIds.includes(teacher.id)) teacher.nrcs.push(nrc);
      }
      body = { nrc };
    } else {
      const input = req.postDataJSON() as {
        name: string;
        email: string;
        nrcs: string[];
      };
      const teacher = teachers.find((item) => item.id === path.split("/")[1]);
      if (teacher) Object.assign(teacher, input);
      else teachers.push({ id: `teacher-${teachers.length + 1}`, ...input });
      body = input;
    }
    if (!body)
      throw new Error(`Unexpected academic request: ${req.method()} ${path}`);
    await route.fulfill({ json: body });
  });
});

test("crea y edita profesores; crea asignaturas y gestiona sus vínculos", async ({
  page,
  context,
}, testInfo) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await loginAs(context, "secretary");
  await page.goto("/dashboard/teachers");
  await page
    .getByRole("button", { name: "Crear profesor", exact: true })
    .click();
  let dialog = page.getByRole("dialog");
  await dialog.getByLabel("Nombre del profesor").fill("Pedro Pérez");
  await dialog.getByLabel("Correo electrónico").fill("pedro@example.com");
  await dialog.getByLabel(/Biología marina/).check();
  await page.screenshot({ path: testInfo.outputPath("teacher-desktop.png") });
  await dialog.getByRole("button", { name: "Guardar profesor" }).click();
  await expect(page.getByText("Pedro Pérez", { exact: true })).toBeVisible();
  await page
    .getByRole("button", { name: "Editar Pedro Pérez y sus asignaturas" })
    .click();
  dialog = page.getByRole("dialog");
  await expect(dialog.getByLabel(/Biología marina/)).toBeChecked();
  await dialog.getByLabel("Nombre del profesor").fill("Pedro Silva");
  await dialog.getByRole("button", { name: "Guardar profesor" }).click();
  await expect(page.getByText("Pedro Silva", { exact: true })).toBeVisible();
  await page.goto("/dashboard/subjects");
  await page
    .getByRole("button", { name: "Crear asignatura", exact: true })
    .click();
  dialog = page.getByRole("dialog");
  await dialog.getByLabel("Nombre de la asignatura").fill("Oceanografía");
  await dialog.getByLabel("NRC", { exact: true }).fill("10002");
  await dialog.getByLabel("Sala", { exact: true }).fill("Laboratorio 2");
  await page.screenshot({ path: testInfo.outputPath("course-desktop.png") });
  await dialog
    .getByRole("button", { name: "Crear asignatura", exact: true })
    .click();
  const row = page
    .getByRole("listitem")
    .filter({
      has: page.getByRole("heading", { name: "Oceanografía", exact: true }),
    });
  await row.getByRole("button", { name: "Profesores", exact: true }).click();
  await page
    .getByRole("dialog")
    .getByLabel(/Pedro Silva/)
    .check();
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Guardar vínculos" })
    .click();
  await expect(row.getByText("Pedro Silva", { exact: true })).toBeVisible();
  await row.getByRole("button", { name: "Profesores", exact: true }).click();
  await page
    .getByRole("dialog")
    .getByLabel(/Pedro Silva/)
    .uncheck();
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Guardar vínculos" })
    .click();
  await expect(row.getByText("Sin profesor asignado")).toBeVisible();
  expect(errors).toEqual([]);
});

test("formularios en móvil y modo oscuro sin desbordamiento", async ({
  page,
  context,
}, testInfo) => {
  await context.addInitScript(() => localStorage.setItem("theme", "dark"));
  await page.setViewportSize({ width: 390, height: 844 });
  await loginAs(context, "secretary");
  await page.goto("/dashboard/teachers");
  await page
    .getByRole("button", { name: "Editar Ana Soto y sus asignaturas" })
    .click();
  await expect(
    page.getByRole("dialog").getByLabel(/Biología marina/),
  ).toBeChecked();
  await page.screenshot({
    path: testInfo.outputPath("teacher-mobile-dark.png"),
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
  await page.goto("/dashboard/subjects");
  await page
    .getByRole("button", { name: "Crear asignatura", exact: true })
    .click();
  await expect(
    page.getByRole("dialog").getByLabel("Sala", { exact: true }),
  ).toBeVisible();
  await page.screenshot({
    path: testInfo.outputPath("course-mobile-dark.png"),
  });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
});

test("analistas consultan sin acciones de mantenimiento", async ({
  page,
  context,
}) => {
  await loginAs(context, "analyst");
  await page.goto("/dashboard/teachers");
  await expect(page.getByText("Ana Soto", { exact: true })).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Crear profesor", exact: true }),
  ).toHaveCount(0);
  await expect(
    page.getByRole("button", { name: /Editar Ana Soto/ }),
  ).toHaveCount(0);
  await page.goto("/dashboard/subjects");
  await expect(
    page.getByRole("heading", { name: "Biología marina", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Crear asignatura", exact: true }),
  ).toHaveCount(0);
  await expect(
    page.getByRole("button", { name: "Profesores", exact: true }),
  ).toHaveCount(0);
});
