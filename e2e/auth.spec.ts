import { BACKEND_URL } from '../playwright.config';
import { expect, loginAs, test } from './support';

test.describe('sesión y acceso por rol', () => {
  test('sin sesión el dashboard redirige al login', async ({ page }) => {
    await page.goto('/dashboard/justifications');

    await expect(page).toHaveURL(/\/login$/);
    await expect(page.getByRole('link', { name: 'Continuar con Google' })).toHaveAttribute(
      'href',
      `${BACKEND_URL}/api/auth/google`,
    );
  });

  test('con sesión, /login lleva al dashboard', async ({ page, context }) => {
    await loginAs(context, 'secretary');
    await page.goto('/login');

    await expect(page).toHaveURL(/\/dashboard$/);
  });

  test('el callback de OAuth no redirige fuera del sitio', async ({ page, context }) => {
    await loginAs(context, 'secretary');
    await page.goto('/auth/callback?route=https://evil.test/phish');

    await expect(page).toHaveURL(/^http:\/\/localhost:3100\/dashboard$/);
  });

  test('una sesión inválida o vencida vuelve al login y limpia la cookie', async ({ page, context }) => {
    // Mismo caso que una cuenta desactivada o una sesión expirada en Redis.
    await context.addCookies([{ name: 'token', value: 'vencida', domain: 'localhost', path: '/' }]);
    await page.goto('/dashboard');

    await expect(page).toHaveURL(/\/login$/);
    await expect(page.getByRole('link', { name: 'Continuar con Google' })).toBeVisible();
    expect((await context.cookies()).map((cookie) => cookie.name)).not.toContain('token');
  });

  const MENU: Record<'coordinator' | 'secretary' | 'analyst' | 'admin', { visible: string[]; hidden: string[] }> = {
    coordinator: { visible: ['Justificaciones'], hidden: ['Usuarios', 'Gestión de justificaciones'] },
    secretary: { visible: ['Gestión de justificaciones', 'Profesores'], hidden: ['Usuarios', 'Auditoría del sistema'] },
    analyst: { visible: ['Reportes e indicadores'], hidden: ['Usuarios', 'Gestión de justificaciones'] },
    admin: { visible: ['Usuarios', 'Gestión de justificaciones', 'Auditoría del sistema'], hidden: ['Justificaciones'] },
  };

  for (const [account, { visible, hidden }] of Object.entries(MENU)) {
    test(`el menú lateral de ${account} solo muestra sus módulos`, async ({ page, context }) => {
      await loginAs(context, account as keyof typeof MENU);
      await page.goto('/dashboard');
      const nav = page.getByRole('navigation').first();

      for (const label of visible) await expect(nav.getByRole('link', { name: label, exact: true })).toBeVisible();
      for (const label of hidden) await expect(nav.getByRole('link', { name: label, exact: true })).toHaveCount(0);
    });
  }

  test('secretaría no ve la bandeja del coordinador aunque escriba la URL', async ({ page, context }) => {
    await loginAs(context, 'secretary');
    await page.goto('/dashboard/justifications');

    await expect(page.getByText('No tienes acceso a esta página.')).toBeVisible();
    await expect(page.getByText('Justificaciones entrantes')).toHaveCount(0);
  });

  test('secretaría no ve la administración de usuarios aunque escriba la URL', async ({ page, context }) => {
    await loginAs(context, 'secretary');
    await page.goto('/dashboard/users');

    await expect(page.getByText('No tienes acceso a esta página.')).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Usuarios' })).toHaveCount(0);
  });

  test('cerrar sesión llama al backend y vuelve al inicio de sesión', async ({ page, context }) => {
    await loginAs(context, 'coordinator');
    await page.goto('/dashboard');
    await expect(page.getByText('Verificando sesión…')).toHaveCount(0);

    const logout = page.waitForRequest((request) => request.url() === `${BACKEND_URL}/api/auth/logout`);
    await page.getByRole('button', { name: 'Abrir menú de cuenta' }).first().click();
    await page.getByRole('button', { name: 'Cerrar sesión' }).click();
    expect((await logout).method()).toBe('POST');
  });
});
