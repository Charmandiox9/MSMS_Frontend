import { expect, loginAs, test } from "./support";

for (const mode of ["desktop", "collapsed", "mobile"] as const) {
  test(`mantiene el menú de cuenta dentro de la pantalla (${mode})`, async ({
    page,
    context,
  }, testInfo) => {
    await page.setViewportSize({
      width: mode === "mobile" ? 390 : 1440,
      height: 720,
    });
    await context.addInitScript(() => {
      localStorage.setItem("marsys_essential_storage_notice_dismissed", "1");
      localStorage.setItem("theme", "dark");
    });
    await page.route("**/api/legal/terms/status", (route) =>
      route.fulfill({ json: { accepted: true, currentVersion: "test" } }),
    );
    await page.route("**/api/academic/careers**", (route) =>
      route.fulfill({ json: [] }),
    );
    await loginAs(context, "admin");
    await page.goto("/es/dashboard/careers");
    if (mode === "mobile")
      await page
        .getByRole("button", { name: "Abrir menú", exact: true })
        .click();
    if (mode === "collapsed")
      await page
        .getByRole("button", { name: "Contraer barra lateral" })
        .click();
    const trigger = page.locator("[data-account-trigger]:visible");
    await trigger.click();
    const panel = page.locator("[data-account-dial]");
    await expect(panel).toBeVisible();
    const actions = panel.locator(
      'a, button:not([aria-label="Abrir menú de cuenta"])',
    );
    await expect(
      panel.getByRole("link", { name: "Configuración" }),
    ).toHaveCount(0);
    await expect(
      panel.getByRole("link", { name: "Mi perfil" }),
    ).toBeInViewport();
    const assertBounds = async () => {
      for (const action of await actions.all()) {
        await expect(action).toBeInViewport();
        await expect
          .poll(async () => {
            const box = await action.boundingBox();
            return Boolean(
              box &&
              box.x >= 0 &&
              box.y >= 0 &&
              box.x + box.width <= page.viewportSize()!.width &&
              box.y + box.height <= page.viewportSize()!.height,
            );
          })
          .toBe(true);
      }
    };
    await assertBounds();
    await page.screenshot({ path: testInfo.outputPath("account-menu.png") });
    await page.setViewportSize({
      width: mode === "mobile" ? 360 : 1100,
      height: 560,
    });
    await assertBounds();
    await page.keyboard.press("Escape");
    await expect(panel).not.toBeVisible();
    await expect(trigger).toBeFocused();
  });
}
