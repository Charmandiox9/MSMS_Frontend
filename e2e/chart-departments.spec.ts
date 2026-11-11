import { expect, loginAs, test } from "./support";

for (const mobile of [false, true]) {
  test(`cuenta proyectos y publicaciones por departamento (${mobile ? 'móvil' : 'escritorio'})`, async ({page, context}) => {
    await page.setViewportSize({width: mobile ? 390 : 1440, height: 1000});
    await page.route('**/api/legal/terms/status', route => route.fulfill({json: {accepted: true, currentVersion: 'test', acceptedAt: '2026-11-11T12:00:00Z'}}));
    await page.route('**/api/graphql', route => route.fulfill({json: {data: {academicCharts: {
      projects: {columns: ['status'], rows: [{values: ['REGISTERED']}], totalRows: 1},
      projectsByDepartment: [{label: 'Biología Marina', value: '2'}, {label: 'Ingeniería en Acuicultura', value: '0'}, {label: 'IPRYMA', value: '3'}, {label: '', value: '1'}],
      publicationsByDepartment: [{label: 'Biología Marina', value: '4'}, {label: 'Ingeniería en Acuicultura', value: '2'}, {label: 'IPRYMA', value: '0'}, {label: '', value: '2'}],
      researchByYear: [], outputs: [], hourlyByComponent: [], semesters: [],
    }}}}));
    await loginAs(context, 'analyst');
    await page.goto('/es/dashboard/charts');
    await expect(page.getByRole('heading', {name: 'Cantidad de proyectos por departamento'})).toBeVisible();
    await expect(page.getByRole('heading', {name: 'Cantidad de publicaciones por departamento'})).toBeVisible();
    await expect(page.getByText('Sin asignar', {exact: true})).toHaveCount(2);
    await expect(page.getByRole('heading', {name: 'Presupuesto registrado por moneda'})).toHaveCount(0);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
    await page.goto('/es/dashboard/academic-workload');
    await expect(page.getByText('Página no encontrada', {exact: true})).toBeVisible();
  });
}
