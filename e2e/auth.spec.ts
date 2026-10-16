import { BACKEND_URL } from "../playwright.config";
import { expect, loginAs, test } from "./support";
import es from "../messages/es.json";

test.describe("sesión y acceso por rol", () => {
  test("la portada sin sesión muestra el acceso con Google", async ({
    page,
  }) => {
    await page.goto("/");
    await expect(
      page.getByRole("link", { name: "Continuar con Google" }),
    ).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "Elige tu vista de trabajo" }),
    ).toHaveCount(0);
  });

  for (const [account, role, title] of [
    ["admin", "SYSTEM_ADMIN", es.DashboardViews.systemAdmin.title],
    [
      "secretary",
      "ACADEMIC_SECRETARY",
      es.DashboardViews.academicSecretary.title,
    ],
    [
      "analyst",
      "ACADEMIC_PROCESS_ANALYST",
      es.DashboardViews.academicProcessAnalyst.title,
    ],
    [
      "coordinator",
      "TEACHING_SUPPORT_COORDINATOR",
      es.DashboardViews.teachingSupportCoordinator.title,
    ],
  ] as const) {
    test(`la portada con sesión de ${account} abre el dashboard de su único rol`, async ({
      page,
      context,
    }) => {
      await loginAs(context, account);
      await context.addInitScript(() =>
        localStorage.setItem("marsys_active_role", "STALE_ROLE"),
      );
      await page.goto("/");
      await expect(page).toHaveURL(/\/dashboard$/);
      await expect(
        page.getByRole("heading", { name: title, exact: true }),
      ).toBeVisible();
      expect(
        await page.evaluate(() => localStorage.getItem("marsys_active_role")),
      ).toBe(role);
      await expect(
        page.getByRole("link", { name: "Continuar con Google" }),
      ).toHaveCount(0);
    });
  }

  test("una sesión de producción también abre el dashboard desde la portada", async ({
    page,
    context,
  }) => {
    await context.addCookies([
      {
        name: "session",
        value: "secretary",
        domain: "localhost",
        path: "/",
        httpOnly: true,
      },
    ]);
    await page.goto("/");
    await expect(page).toHaveURL(/\/dashboard$/);
    await expect(
      page.getByRole("heading", {
        name: es.DashboardViews.academicSecretary.title,
        exact: true,
      }),
    ).toBeVisible();
  });

  test("con varios roles exige elegir la vista aunque hubiera otra guardada", async ({
    page,
    context,
  }, testInfo) => {
    await loginAs(context, "multi");
    await context.addInitScript(() =>
      localStorage.setItem("marsys_active_role", "SYSTEM_ADMIN"),
    );
    await page.goto("/");
    await expect(
      page.getByRole("heading", { name: "Elige tu vista de trabajo" }),
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Entrar al dashboard" }),
    ).toBeDisabled();
    await page.screenshot({
      path: testInfo.outputPath("role-selection-desktop.png"),
    });
    await page.getByRole("radio", { name: "Apoyo docente" }).check();
    await page.getByRole("button", { name: "Entrar al dashboard" }).click();
    await expect(
      page.getByRole("heading", {
        name: es.DashboardViews.teachingSupportCoordinator.title,
        exact: true,
      }),
    ).toBeVisible();
    await page.goto("/");
    await expect(
      page.getByRole("heading", { name: "Elige tu vista de trabajo" }),
    ).toBeVisible();
  });

  test("el callback con varios roles pasa por el selector de vista", async ({
    page,
    context,
  }) => {
    await loginAs(context, "multi");
    await page.goto("/auth/callback?route=/dashboard");
    await expect(
      page.getByRole("heading", { name: "Elige tu vista de trabajo" }),
    ).toBeVisible();
  });

  test("una cookie vencida en la portada o login muestra Google sin entrar en un bucle", async ({
    page,
    context,
  }) => {
    await context.addCookies([
      { name: "token", value: "expired", domain: "localhost", path: "/" },
    ]);
    for (const path of ["/", "/login"]) {
      await page.goto(path);
      await expect(
        page.getByRole("link", { name: "Continuar con Google" }),
      ).toBeVisible();
      await expect(page).not.toHaveURL(/\/dashboard$/);
    }
  });

  test("selector de roles en móvil, modo oscuro e inglés", async ({
    page,
    context,
  }, testInfo) => {
    await loginAs(context, "multi");
    await context.addInitScript(() => localStorage.setItem("theme", "dark"));
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/en/login");
    await expect(
      page.getByRole("heading", { name: "Choose your workspace" }),
    ).toBeVisible();
    await page.screenshot({
      path: testInfo.outputPath("role-selection-mobile-dark.png"),
    });
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
  });
  test("sin sesión el dashboard redirige al login", async ({ page }) => {
    await page.goto("/dashboard/justifications");

    await expect(page).toHaveURL(/\/login$/);
    await expect(
      page.getByRole("link", { name: "Continuar con Google" }),
    ).toHaveAttribute("href", `${BACKEND_URL}/api/auth/google`);
  });

  test("con sesión, /login lleva al dashboard", async ({ page, context }) => {
    await loginAs(context, "secretary");
    await page.goto("/login");

    await expect(page).toHaveURL(/\/dashboard$/);
  });

  test("el callback de OAuth no redirige fuera del sitio", async ({
    page,
    context,
  }) => {
    await loginAs(context, "secretary");
    await page.goto("/auth/callback?route=https://evil.test/phish");

    await expect(page).toHaveURL(/^http:\/\/localhost:3100\/dashboard$/);
  });

  test("una sesión inválida o vencida vuelve al login y limpia la cookie", async ({
    page,
    context,
  }) => {
    // Mismo caso que una cuenta desactivada o una sesión expirada en Redis.
    await context.addCookies([
      { name: "token", value: "vencida", domain: "localhost", path: "/" },
    ]);
    await page.goto("/dashboard");

    await expect(page).toHaveURL(/\/login$/);
    await expect(
      page.getByRole("link", { name: "Continuar con Google" }),
    ).toBeVisible();
    expect(
      (await context.cookies()).map((cookie) => cookie.name),
    ).not.toContain("token");
  });

  const MENU: Record<
    "coordinator" | "secretary" | "analyst" | "admin",
    { visible: string[]; hidden: string[] }
  > = {
    coordinator: {
      visible: ["Justificaciones"],
      hidden: ["Usuarios", "Gestión de justificaciones"],
    },
    secretary: {
      visible: ["Gestión de justificaciones", "Profesores"],
      hidden: ["Usuarios", "Auditoría del sistema"],
    },
    analyst: {
      visible: ["Reportes e indicadores"],
      hidden: ["Usuarios", "Gestión de justificaciones"],
    },
    admin: {
      visible: [
        "Usuarios",
        "Gestión de justificaciones",
        "Auditoría del sistema",
      ],
      hidden: ["Justificaciones"],
    },
  };

  for (const [account, { visible, hidden }] of Object.entries(MENU)) {
    test(`el menú lateral de ${account} solo muestra sus módulos`, async ({
      page,
      context,
    }) => {
      await loginAs(context, account as keyof typeof MENU);
      await page.goto("/dashboard");
      const nav = page.getByRole("navigation").first();

      for (const label of visible)
        await expect(
          nav.getByRole("link", { name: label, exact: true }),
        ).toBeVisible();
      for (const label of hidden)
        await expect(
          nav.getByRole("link", { name: label, exact: true }),
        ).toHaveCount(0);
    });
  }

  test("secretaría no ve la bandeja del coordinador aunque escriba la URL", async ({
    page,
    context,
  }) => {
    await loginAs(context, "secretary");
    await page.goto("/dashboard/justifications");

    await expect(
      page.getByText("No tienes acceso a esta página."),
    ).toBeVisible();
    await expect(page.getByText("Justificaciones entrantes")).toHaveCount(0);
  });

  test("secretaría no ve la administración de usuarios aunque escriba la URL", async ({
    page,
    context,
  }) => {
    await loginAs(context, "secretary");
    await page.goto("/dashboard/users");

    await expect(
      page.getByText("No tienes acceso a esta página."),
    ).toBeVisible();
    await expect(page.getByRole("heading", { name: "Usuarios" })).toHaveCount(
      0,
    );
  });

  test("cerrar sesión llama al backend y vuelve al inicio de sesión", async ({
    page,
    context,
  }) => {
    await loginAs(context, "coordinator");
    await page.goto("/dashboard");
    await expect(page.getByText("Verificando sesión…")).toHaveCount(0);

    const logout = page.waitForRequest(
      (request) => request.url() === `${BACKEND_URL}/api/auth/logout`,
    );
    await page
      .getByRole("button", { name: "Abrir menú de cuenta" })
      .first()
      .click();
    await page.getByRole("button", { name: "Cerrar sesión" }).click();
    expect((await logout).method()).toBe("POST");
  });
});
