import { expect, loginAs, test } from "./support";

for (const viewport of [
  { width: 1440, height: 720, mobile: false },
  { width: 320, height: 560, mobile: true },
]) {
  test(`mantiene los controles de cuenta accesibles a ${viewport.width} px`, async ({ page, context }) => {
    await page.setViewportSize({ width: viewport.width, height: viewport.height });
    await loginAs(context, "multi");
    await page.goto("/dashboard");

    const openNavigation = page.getByRole("button", { name: "Abrir menú", exact: true });
    if (viewport.mobile) await openNavigation.click();

    const trigger = page.getByRole("button", { name: "Mi cuenta" });
    await expect(trigger.getByText("Administrador del sistema")).toBeVisible();
    await trigger.click();

    const panel = page.getByRole("region", { name: "Mi cuenta" });
    const profile = panel.getByRole("link", { name: "Mi perfil" });
    await expect(profile).toBeInViewport();
    await expect(profile).toBeFocused();
    await expect(panel.getByRole("switch", { name: "Modo oscuro" })).toBeVisible();
    await expect(panel.getByRole("radiogroup", { name: "Idioma" })).toBeVisible();
    await expect(panel.getByRole("button", { name: "Cerrar sesión" })).toBeInViewport();

    const switchRole = panel.getByRole("button", {
      name: "Cambiar rol. Rol actual: Administrador del sistema",
    });
    await switchRole.click();
    const roles = page.getByRole("region", { name: "Roles disponibles" });
    const nextRole = roles.getByRole("button", { name: "Apoyo docente" });
    await expect(nextRole).toBeFocused();
    await nextRole.click();
    const confirmation = roles.getByRole("region", { name: "Confirmar cambio de rol" });
    await expect(confirmation.getByRole("button", { name: "Cancelar" })).toBeFocused();
    await page.keyboard.press("Escape");
    await expect(confirmation).toHaveCount(0);
    await expect(nextRole).toBeFocused();
    await page.keyboard.press("Escape");
    await expect(roles).toHaveCount(0);
    await expect(switchRole).toBeFocused();
    await page.keyboard.press("Escape");
    await expect(panel).toHaveCount(0);
    await expect(trigger).toBeFocused();

    if (viewport.mobile) {
      await page.keyboard.press("Escape");
      await expect(openNavigation).toBeFocused();
    }
  });
}

test("resuelve el tema del sistema y conserva el tema elegido al recargar", async ({ page, context }) => {
  await page.emulateMedia({ colorScheme: "dark" });
  await loginAs(context, "admin");
  await page.goto("/dashboard");
  await page.getByRole("button", { name: "Mi cuenta" }).click();

  const theme = page.getByRole("switch", { name: "Modo oscuro" });
  const dashboard = page.locator(".dashboard-workspace");
  await expect(theme).toBeChecked();
  await expect(dashboard).toHaveCSS("background-color", "rgb(27, 28, 30)");
  await theme.press("Space");
  await expect(theme).not.toBeChecked();
  await expect(page.locator("html")).toHaveClass(/\blight\b/);
  await expect(dashboard).toHaveCSS("background-color", "rgb(238, 243, 245)");

  await page.reload();
  await page.getByRole("button", { name: "Mi cuenta" }).click();
  await expect(theme).not.toBeChecked();
  await expect(dashboard).toHaveCSS("background-color", "rgb(238, 243, 245)");
});

test("cambia el idioma sin perder la ruta, los filtros de la URL ni el fragmento", async ({ page, context }) => {
  const path = "/dashboard/students?nrc=12345#results";
  await loginAs(context, "admin");
  await page.goto(path);
  const originalUrl = page.url();
  await page.getByRole("button", { name: "Mi cuenta" }).click();
  await page.getByRole("radio", { name: "English" }).press("Space");

  await expect(page.locator("html")).toHaveAttribute("lang", "en");
  await expect(page).toHaveURL(originalUrl);
  await page.getByRole("button", { name: "My account" }).click();
  await expect(page.getByRole("radio", { name: "English" })).toBeChecked();
  await page.getByRole("radio", { name: "Español" }).press("Space");

  await expect(page.locator("html")).toHaveAttribute("lang", "es");
  await expect(page).toHaveURL(originalUrl);
});
