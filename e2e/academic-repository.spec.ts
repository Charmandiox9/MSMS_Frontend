import { expect, loginAs, test } from "./support";
import type { RepositoryRecord } from "../src/types/academic-repository";

test.beforeEach(async ({ page }) => {
  const store: Record<"projects" | "research", RepositoryRecord[]> = {
    projects: [],
    research: [],
  };
  let revision = 0;
  await page.route("**/api/academic/**", async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    const path = url.pathname.replace("/api/academic/", "").split("/");
    const key = path[0];
    if (key === "teachers") {
      await route.fulfill({
        json: { items: [], total: 0, page: 1, pageSize: 100, totalPages: 0 },
      });
      return;
    }
    if (key !== "projects" && key !== "research") {
      await route.fallback();
      return;
    }
    const rows = store[key];
    const row = rows.find((item) => item.id === path[1]);
    const enriched = (item: RepositoryRecord): RepositoryRecord => ({
      ...item,
      ...(key === "projects"
        ? {
            research:
              store.research.find((value) => value.projectId === item.id) ??
              null,
          }
        : {
            project:
              store.projects.find((value) => value.id === item.projectId) ??
              null,
          }),
    });
    if (request.method() === "GET") {
      if (path[1]) {
        await route.fulfill({
          json: row ? enriched(row) : null,
          status: row ? 200 : 404,
        });
        return;
      }
      const needle = url.searchParams.get("search")?.toLowerCase() ?? "";
      const filtered = rows.filter((item) =>
        `${item.title} ${item.code ?? ""} ${item.academicUnit}`
          .toLowerCase()
          .includes(needle),
      );
      await route.fulfill({
        json: {
          items: filtered.map(enriched),
          total: filtered.length,
          page: 1,
          pageSize: 10,
          totalPages: filtered.length ? 1 : 0,
        },
      });
      return;
    }
    if (request.method() === "DELETE") {
      if (
        key === "projects" &&
        store.research.some((item) => item.projectId === row?.id)
      ) {
        await route.fulfill({
          status: 409,
          json: {
            message:
              "Desvincula la investigación y los resultados antes de eliminar el proyecto",
          },
        });
        return;
      }
      rows.splice(
        rows.findIndex((item) => item.id === path[1]),
        1,
      );
      await route.fulfill({ json: { success: true } });
      return;
    }
    const input = request.postDataJSON() as Partial<RepositoryRecord>;
    const updatedAt = new Date(
      Date.UTC(2026, 9, 14, 12, 0, ++revision),
    ).toISOString();
    if (row) {
      Object.assign(row, input, { updatedAt });
      await route.fulfill({ json: enriched(row) });
      return;
    }
    const created: RepositoryRecord = {
      id: `${key}-${revision}`,
      title: "",
      academicUnit: "",
      code: null,
      startsOn: null,
      endsOn: null,
      createdAt: updatedAt,
      participants: [],
      _count: { outputs: 0 },
      ...input,
      updatedAt,
    };
    rows.push(created);
    await route.fulfill({ json: enriched(created) });
  });
});

for (const account of ["analyst", "secretary", "admin"] as const) {
  test(`CRUD completo de proyectos e investigaciones para ${account}`, async ({
    page,
    context,
  }, testInfo) => {
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.message));
    if (account === "secretary") {
      await page.setViewportSize({ width: 390, height: 844 });
      await page.emulateMedia({ colorScheme: "dark" });
      await page.addInitScript(() => localStorage.setItem("theme", "dark"));
    }
    await loginAs(context, account);
    await page.goto("/dashboard/projects");
    await expect(
      page.getByRole("heading", { name: "Proyectos", exact: true }),
    ).toBeVisible();
    await page.getByRole("button", { name: "Crear proyecto" }).click();
    let dialog = page.getByRole("dialog");
    await expect(
      dialog.getByRole("button", { name: "Guardar", exact: true }),
    ).toBeEnabled();
    await dialog
      .getByLabel("Título", { exact: false })
      .fill("Observatorio costero");
    await dialog
      .getByLabel("Unidad académica", { exact: false })
      .fill("Ciencias del Mar");
    await dialog.getByLabel("Código", { exact: true }).fill("MAR-2026");
    await dialog.getByLabel("Moneda", { exact: true }).fill("CLP");
    await dialog.getByLabel("Monto total", { exact: true }).fill("2500000.50");
    await dialog.getByRole("button", { name: "Añadir participante" }).click();
    await dialog
      .getByLabel("Nombre", { exact: true })
      .fill("Participante externo");
    await dialog
      .getByLabel("Rol del participante", { exact: true })
      .fill("Director");
    await dialog.getByRole("button", { name: "Guardar", exact: true }).click();
    await expect(dialog).not.toBeVisible();
    await expect(
      page.getByRole("button", { name: "Observatorio costero", exact: true }),
    ).toBeVisible();
    await page
      .getByRole("button", { name: "Ver Observatorio costero", exact: true })
      .click();
    dialog = page.getByRole("dialog");
    await expect(
      dialog.getByText("Participante externo", { exact: true }),
    ).toBeVisible();
    await expect(dialog.getByText("2500000.50", { exact: true })).toBeVisible();
    await dialog.getByRole("button", { name: "Cerrar ventana" }).click();
    await page
      .getByRole("button", { name: "Editar Observatorio costero", exact: true })
      .click();
    dialog = page.getByRole("dialog");
    await expect(
      dialog.getByRole("button", { name: "Guardar", exact: true }),
    ).toBeEnabled();
    await dialog
      .getByLabel("Título", { exact: false })
      .fill("Observatorio costero actualizado");
    await dialog.getByRole("button", { name: "Guardar", exact: true }).click();
    await expect(
      page.getByRole("button", {
        name: "Observatorio costero actualizado",
        exact: true,
      }),
    ).toBeVisible();
    await page.screenshot({
      path: testInfo.outputPath(`projects-${account}.png`),
      fullPage: true,
    });

    await page.goto("/dashboard/research");
    await page.getByRole("button", { name: "Crear investigación" }).click();
    dialog = page.getByRole("dialog");
    await expect(
      dialog.getByRole("button", { name: "Guardar", exact: true }),
    ).toBeEnabled();
    await dialog
      .getByLabel("Título", { exact: false })
      .fill("Estudio de biodiversidad");
    await dialog
      .getByLabel("Unidad académica", { exact: false })
      .fill("Ciencias del Mar");
    await dialog
      .getByRole("combobox", { name: "Proyecto", exact: true })
      .selectOption({ label: "MAR-2026 · Observatorio costero actualizado" });
    await dialog
      .getByLabel("Descripción", { exact: true })
      .fill("Actividad científica con seguimiento de ecosistemas.");
    await page.screenshot({
      path: testInfo.outputPath(`research-form-${account}.png`),
      fullPage: true,
    });
    await dialog.getByRole("button", { name: "Guardar", exact: true }).click();
    await expect(
      page.getByRole("button", {
        name: "Estudio de biodiversidad",
        exact: true,
      }),
    ).toBeVisible();
    await page
      .getByRole("button", {
        name: "Ver Estudio de biodiversidad",
        exact: true,
      })
      .click();
    dialog = page.getByRole("dialog");
    await expect(
      dialog.getByText("Observatorio costero actualizado", { exact: true }),
    ).toBeVisible();
    await dialog.getByRole("button", { name: "Editar", exact: true }).click();
    dialog = page.getByRole("dialog");
    await expect(
      dialog.getByRole("button", { name: "Guardar", exact: true }),
    ).toBeEnabled();
    await dialog
      .getByLabel("Título", { exact: false })
      .fill("Estudio actualizado");
    await dialog.getByRole("button", { name: "Guardar", exact: true }).click();
    await expect(
      page.getByRole("button", { name: "Estudio actualizado", exact: true }),
    ).toBeVisible();
    await page
      .getByRole("button", {
        name: "Eliminar Estudio actualizado",
        exact: true,
      })
      .click();
    await page.getByRole("button", { name: "Confirmar eliminación" }).click();
    await expect(
      page.getByText("Aún no hay investigaciones registradas"),
    ).toBeVisible();
    await page.goto("/dashboard/projects");
    await page
      .getByRole("button", {
        name: "Eliminar Observatorio costero actualizado",
        exact: true,
      })
      .click();
    await page.getByRole("button", { name: "Confirmar eliminación" }).click();
    await expect(
      page.getByText("Aún no hay proyectos registrados"),
    ).toBeVisible();
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth,
      ),
    ).toBe(true);
    expect(errors).toEqual([]);
  });
}

test("muestra textos ingleses y deniega acceso a coordinación", async ({
  page,
  context,
}) => {
  await loginAs(context, "analyst");
  await page.goto("/en/dashboard/research");
  await expect(
    page.getByRole("heading", { name: "Research", exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Create research" }).click();
  await expect(
    page.getByRole("dialog").getByText("Identification", { exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Close window" }).click();
  await context.clearCookies();
  await loginAs(context, "coordinator");
  await page.goto("/dashboard/projects");
  await expect(page.getByText("No tienes acceso a esta página.")).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Crear proyecto" }),
  ).toHaveCount(0);
});
