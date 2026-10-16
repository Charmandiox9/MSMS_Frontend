import { backendState, expect, loginAs, test } from './support';

test.describe('administración de usuarios', () => {
  test.beforeEach(async ({ context, page }) => {
    await loginAs(context, 'admin');
    await page.goto('/dashboard/users');
    await expect(page.getByText('Ana Pérez')).toBeVisible();
  });

  test('asigna un rol y la fila refleja lo que guardó el backend', async ({ page }) => {
    const ana = page.getByRole('listitem').filter({ hasText: 'ana@ucn.cl' });
    await ana.getByRole('button', { name: 'Gestionar roles' }).click();

    const dialog = page.getByRole('dialog');
    await dialog
      .locator('div', { has: page.getByText('Analista de procesos', { exact: true }) })
      .getByRole('button', { name: 'Asignar' })
      .last()
      .click();

    await expect(page.getByText('Se asignó Analista de procesos a Ana Pérez.')).toBeVisible();
    await page.getByRole('button', { name: 'Cerrar' }).click();
    await expect(ana.getByText('Analista de procesos')).toBeVisible();

    const state = await backendState();
    expect(state.users.find((user) => user.id === 'u-1')!.roles.map((role) => role.code)).toContain('ACADEMIC_PROCESS_ANALYST');
  });

  test('si el backend impide eliminar, la cuenta sigue en la lista', async ({ page }) => {
    await page.getByRole('button', { name: 'Eliminar permanentemente a Beto Soto' }).click();
    await page.getByRole('button', { name: 'Eliminar definitivamente' }).click();

    await expect(page.getByText('El usuario tiene historial académico y no puede eliminarse')).toBeVisible();
    await expect(page.getByRole('listitem').filter({ hasText: 'beto@ucn.cl' })).toBeVisible();
    await expect(page.getByText('Eliminar usuario definitivamente')).toBeVisible();
  });

  test('elimina una cuenta sin historial', async ({ page }) => {
    await page.getByRole('button', { name: 'Eliminar permanentemente a Ana Pérez' }).click();
    await page.getByRole('button', { name: 'Eliminar definitivamente' }).click();

    await expect(page.getByText('Se eliminó permanentemente la cuenta de Ana Pérez.')).toBeVisible();
    await expect(page.getByRole('listitem').filter({ hasText: 'ana@ucn.cl' })).toHaveCount(0);
    expect((await backendState()).users.map((user) => user.id)).toEqual(['u-2']);
  });
});

test.describe('cambio de rol activo', () => {
  test('una cuenta con dos roles cambia de menú y de páginas al cambiar de rol', async ({ context, page }) => {
    await loginAs(context, 'multi');
    await page.goto('/dashboard');
    const nav = page.getByRole('navigation').first();
    await expect(nav.getByRole('link', { name: 'Usuarios', exact: true })).toBeVisible();

    await page.getByRole('button', { name: 'Cambiar rol activo' }).first().click();
    await page.getByRole('option', { name: /Apoyo docente/ }).click();

    await expect(nav.getByRole('link', { name: 'Justificaciones', exact: true })).toBeVisible();
    await expect(nav.getByRole('link', { name: 'Usuarios', exact: true })).toHaveCount(0);

    await page.reload();
    await expect(page.getByRole('navigation').first().getByRole('link', { name: 'Justificaciones', exact: true })).toBeVisible();
  });
});
