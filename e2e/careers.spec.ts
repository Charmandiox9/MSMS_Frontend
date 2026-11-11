import { readFileSync } from "node:fs";
import { expect, loginAs, test } from "./support";

for (const mobile of [false, true]) {
  test(`visualiza la malla por años (${mobile ? "móvil oscuro" : "escritorio claro"})`, async ({page, context}, testInfo) => {
    await page.setViewportSize({width: mobile ? 390 : 1440, height: mobile ? 844 : 1100});
    await context.addInitScript((theme) => localStorage.setItem("theme", theme), mobile ? "dark" : "light");
    const csv = readFileSync("e2e/fixtures/curriculum.csv", "utf8");
    const courses = csv.trim().split(/\r?\n/).slice(1).map((line, index) => {
      const [name, term] = line.split(",");
      return {id: `row-${index}`, courseId: `course-${index}`, termNumber: Number(term), course: {id: `course-${index}`, code: null, name}};
    });
    await page.route("**/api/legal/terms/status", route => route.fulfill({json: {accepted: true, currentVersion: "test", acceptedAt: "2026-11-11T12:00:00Z"}}));
    await page.route("**/api/academic/careers", route => route.fulfill({json: [{id: "career", name: "Biología Marina", code: "BM", isActive: true, updatedAt: "2026-11-11T12:00:00Z", curriculumVersions: [{id: "plan", cohortYear: 2026, _count: {students: 0}, courses}]}]}));
    await loginAs(context, "analyst");
    await page.goto("/es/dashboard/careers");
    await page.getByRole("button", {name: "Ver malla"}).waitFor();
    const notice = page.getByRole("button", {name: "Entendido", exact: true});
    if (await notice.isVisible()) await notice.click();
    await page.getByRole("button", {name: "Ver malla"}).click();
    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible();
    await expect(dialog.getByRole("heading", {name: "Año 5", exact: true})).toBeAttached();
    const positions = await dialog.locator('h4').evaluateAll(headings => headings.filter(el => /^Semestre [2468]$/.test(el.textContent ?? "")).map(el => Math.round(el.getBoundingClientRect().top)));
    expect(new Set(positions).size).toBe(1);
    const region = dialog.getByRole("region", {name: "Malla curricular por año y semestre"});
    const dimensions = await region.evaluate(el => ({width: el.clientWidth, scroll: el.scrollWidth}));
    if (mobile) expect(dimensions.scroll).toBeGreaterThan(dimensions.width);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
    await page.screenshot({path: testInfo.outputPath("curriculum.png")});
    await dialog.getByRole("button", {name: "Cerrar", exact: true}).click();
    await expect(dialog).not.toBeVisible();
    await expect(page.getByRole("button", {name: "Ver malla"})).toBeFocused();
  });
}
