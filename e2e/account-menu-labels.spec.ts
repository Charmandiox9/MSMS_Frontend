import { expect, loginAs, test } from "./support";
for (const mobile of [false, true]) {
  test(`muestra etiquetas claras en el menú circular (${mobile ? 'mobile' : 'desktop'})`, async ({page, context}, testInfo) => {
    await page.setViewportSize({width: mobile ? 390 : 1440, height: 720});
    await context.addInitScript(() => {localStorage.setItem('marsys_essential_storage_notice_dismissed', '1'); localStorage.setItem('theme', 'dark');});
    await page.route('**/api/legal/terms/status', route => route.fulfill({json: {accepted: true, currentVersion: 'test'}}));
    await page.route('**/api/academic/careers**', route => route.fulfill({json: []}));
    await loginAs(context, 'admin'); await page.goto('/es/dashboard/careers');
    if (mobile) await page.getByRole('button', {name: 'Abrir menú', exact: true}).click();
    await page.locator('[data-account-trigger]:visible').click();
    const dial = page.locator('[data-account-dial]');
    await dial.getByRole('link', {name: 'Mi perfil'}).hover();
    await expect(page.getByRole('tooltip')).toHaveText('Mi perfil');
    await expect(dial.getByRole('link', {name: 'Configuración'})).toHaveCount(0);
    await dial.getByRole('button', {name: 'Cambiar a inglés'}).focus();
    const tooltip = page.getByRole('tooltip');
    await expect(tooltip).toHaveText('Cambiar a inglés');
    const box = await tooltip.boundingBox();
    expect(box!.x).toBeGreaterThanOrEqual(12);
    expect(box!.x + box!.width).toBeLessThanOrEqual(page.viewportSize()!.width - 11);
    await page.screenshot({path: testInfo.outputPath('account-labels.png')});
  });
}
