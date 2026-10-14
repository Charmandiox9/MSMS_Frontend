import { expect, loginAs, test } from "./support";
import type { HourlyContractInput } from "../src/types/hourly-payments";

for (const mobile of [false, true]) {
  test(`registra un profesor PH, calcula pagos y guarda contratos (${mobile ? "móvil oscuro" : "escritorio"})`, async ({
    page,
    context,
  }, testInfo) => {
    if (mobile) {
      await page.setViewportSize({ width: 390, height: 844 });
      await context.addInitScript(() => localStorage.setItem("theme", "dark"));
    }
    const semester = {
      id: "11111111-1111-4111-8111-111111111111",
      name: "2026-20",
      startsOn: "2026-08-17",
      endsOn: "2026-12-19",
      isActive: true,
    };
    const rate = {
      id: "22222222-2222-4222-8222-222222222222",
      semesterId: semester.id,
      category: "NEW",
      academicDegree: "PROFESSIONAL",
      certification: "NONE",
      hourlyRateClp: "52000",
    };
    const course = {
      id: "course",
      courseId: "course",
      name: "Química Biológica",
      code: "DCCB 00202",
      nrc: "10001",
    };
    let stored: Record<string, unknown> | null = null;
    let rateUpdate: Record<string, unknown> | null = null;
    const pageErrors: string[] = [];
    page.on("pageerror", (error) => pageErrors.push(error.message));
    await page.route("**/api/academic/**", async (route) => {
      const request = route.request();
      const path = new URL(request.url()).pathname.replace(
        "/api/academic/",
        "",
      );
      let body: unknown;
      if (path === "teachers" && request.method() === "GET")
        body = {
          items: stored
            ? [
                {
                  ...stored,
                  id: "teacher",
                  assignments: [
                    { id: "assignment", nrc: course.nrc, course, semester },
                  ],
                },
              ]
            : [],
          total: stored ? 1 : 0,
          page: 1,
          pageSize: 10,
          totalPages: 1,
        };
      else if (path === "courses/current")
        body = { semester, courses: [{ ...course, teachers: [] }] };
      else if (path === "hourly-payments/rates" && request.method() === "GET")
        body = { semester, rates: [rate] };
      else if (
        path === "hourly-payments/rates" &&
        request.method() === "POST"
      ) {
        rateUpdate = request.postDataJSON() as Record<string, unknown>;
        body = rate;
      } else if (path === "hourly-payments/preview") {
        const input = request.postDataJSON() as {
          contracts: HourlyContractInput[];
        };
        const hours = input.contracts[0].directHours;
        body = {
          lines: input.contracts.map((line) => ({
            ...line,
            calculation: {
              monthlyAmountClp: String(hours * 52000),
              months: [
                {
                  month: "2026-08",
                  days: 14,
                  amountClp: String((hours * 52000 * 14) / 30),
                },
                ...["09", "10", "11"].map((month) => ({
                  month: `2026-${month}`,
                  days: 30,
                  amountClp: String(hours * 52000),
                })),
                {
                  month: "2026-12",
                  days: 19,
                  amountClp: String((hours * 52000 * 19) / 30),
                },
              ],
              totalAmountClp: String(hours * 213200),
            },
          })),
          totalAmountClp: String(hours * 213200),
        };
      } else if (path === "teachers" && request.method() === "POST") {
        stored = request.postDataJSON() as Record<string, unknown>;
        body = { ...stored, id: "teacher" };
      } else
        throw new Error(
          `Unexpected academic request: ${request.method()} ${path}`,
        );
      await route.fulfill({ json: body });
    });
    await loginAs(context, mobile ? 'analyst' : 'secretary');
    await page.goto("/dashboard/teachers");
    await page.getByRole("button", { name: "Tarifas PH", exact: true }).click();
    let dialog = page.getByRole("dialog");
    await dialog.getByRole("button", { name: "Editar tarifa" }).click();
    await expect(
      dialog.getByLabel("Valor mensual por hora directa (CLP)"),
    ).toHaveValue("52000");
    await dialog.getByRole("button", { name: "Guardar tarifa" }).click();
    await expect.poll(() => rateUpdate).not.toBeNull();
    expect(rateUpdate).toMatchObject({
      semesterId: semester.id,
      category: "NEW",
      hourlyRateClp: 52000,
    });
    await dialog.getByRole("button", { name: "Cerrar", exact: true }).click();
    await page
      .getByRole("button", { name: "Crear profesor", exact: true })
      .click();
    dialog = page.getByRole("dialog");
    await dialog.getByLabel("Nombre del profesor").fill("Docente de prueba PH");
    await dialog
      .getByLabel("Correo electrónico")
      .fill("docente-ph@example.com");
    await dialog.getByLabel("RUT", { exact: true }).fill("12.345.678-5");
    await dialog.getByLabel("Grado académico").selectOption("PROFESSIONAL");
    await dialog.getByLabel(/Certificación/).selectOption("NONE");
    await dialog.getByLabel(/Química Biológica/).check();
    await dialog
      .getByLabel("Gestionar contratos y pagos de profesor hora")
      .check();
    await dialog.getByRole("button", { name: "Añadir contrato PH" }).click();
    await dialog.getByLabel("Tarifa aplicable").selectOption(rate.id);
    await dialog.getByLabel("Componente").selectOption("LABORATORY");
    await dialog.getByLabel("Paralelo", { exact: true }).fill("L3");
    await expect(dialog.getByText(/Total del semestre/)).toContainText(
      "639.600",
    );
    await dialog.getByLabel("Horas directas").fill("1.5");
    await expect(dialog.getByText(/Total del semestre/)).toContainText(
      "319.800",
    );
    await dialog.getByText(/Total del semestre/).scrollIntoViewIfNeeded();
    await page.screenshot({
      path: testInfo.outputPath(
        mobile ? "hourly-mobile-dark.png" : "hourly-desktop.png",
      ),
    });
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    expect(
      await dialog.evaluate(
        (element) => element.scrollWidth <= element.clientWidth,
      ),
    ).toBe(true);
    await dialog.getByRole("button", { name: "Guardar profesor" }).click();
    await expect(
      page.getByText("Docente de prueba PH", { exact: true }),
    ).toBeVisible();
    expect(stored).toMatchObject({
      rut: "12.345.678-5",
      semesterId: semester.id,
      nrcs: [course.nrc],
      hourlyContracts: [
        {
          nrc: course.nrc,
          payRateId: rate.id,
          component: "LABORATORY",
          parallel: "L3",
          directHours: 1.5,
          startsOn: "2026-08-17",
          endsOn: "2026-12-19",
        },
      ],
    });
    expect(pageErrors).toEqual([]);
  });
}
