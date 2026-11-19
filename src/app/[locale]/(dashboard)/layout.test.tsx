import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import type { ComponentProps } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import DashboardLayout from './layout';
import { IntlProvider } from '@/test/render';
import { installFakeApi } from '@/test/fake-api';
import { useActiveRole } from '@/context/ActiveRoleContext';

// Referencia estable, como el router real de Next.
const router = vi.hoisted(() => ({ replace: vi.fn() }));
const { replace } = router;
vi.mock('@/i18n/routing', () => ({
  useRouter: () => router,
  usePathname: () => '/dashboard',
  Link: (props: ComponentProps<'a'>) => <a {...props} />,
}));
vi.mock('@/components/dashboard/DashboardAccountMenu', () => ({
  default: () => <button type="button">Cuenta</button>,
}));

function ActiveRole() {
  return <p>rol:{useActiveRole().activeRole}</p>;
}

function renderLayout() {
  return render(
    <IntlProvider>
      <DashboardLayout>
        <ActiveRole />
      </DashboardLayout>
    </IntlProvider>,
  );
}

function installAuthenticatedApi(routes: Parameters<typeof installFakeApi>[0] = {}) {
  return installFakeApi({
    "GET /legal/terms/status": () => ({
      body: {
        currentVersion: "2026-01",
        accepted: true,
        acceptedAt: "2026-01-01T00:00:00.000Z",
      },
    }),
    ...routes,
  });
}

describe('DashboardLayout (sesión)', () => {
  beforeEach(() => {
    replace.mockClear();
    localStorage.clear();
  });

  afterEach(() => vi.unstubAllGlobals());

  it('muestra "Verificando sesión…" y no renderiza el contenido mientras consulta', () => {
    const api = installFakeApi();
    api.on('GET /auth/session', () => new Promise(() => undefined));
    renderLayout();

    expect(screen.getByText('Verificando sesión…')).toBeDefined();
    expect(screen.queryByText(/rol:/)).toBeNull();
  });

  it('redirige al login si no hay sesión y nunca muestra el contenido', async () => {
    installFakeApi({ 'GET /auth/session': () => ({ status: 401, body: { message: 'Unauthorized' } }) });
    renderLayout();

    await waitFor(() => expect(replace).toHaveBeenCalledWith('/login'));
    expect(screen.queryByText(/rol:/)).toBeNull();
    expect(screen.queryByRole('navigation', { name: 'Navegación principal' })).toBeNull();
  });

  it('si la sesión es inválida, limpia la cookie antes de ir al login', async () => {
    // Si la cookie sigue ahí, el middleware devuelve /login → /dashboard y queda en "Verificando sesión…".
    const api = installFakeApi({
      'GET /auth/session': () => ({ status: 401, body: { message: 'Usuario inválido o inactivo' } }),
      'POST /auth/logout': () => ({ status: 204 }),
    });
    renderLayout();

    await waitFor(() => expect(replace).toHaveBeenCalledWith('/login'));
    expect(api.requests.map((request) => `${request.method} ${request.path}`)).toEqual([
      'GET /auth/session',
      'POST /auth/logout',
    ]);
  });

  it('redirige al login si el backend está caído', async () => {
    const api = installFakeApi();
    api.on('GET /auth/session', () => Promise.reject(new TypeError('Failed to fetch')));
    renderLayout();

    await waitFor(() => expect(replace).toHaveBeenCalledWith('/login'));
  });

  it('con sesión renderiza el dashboard con el rol activo', async () => {
    installAuthenticatedApi({
      'GET /auth/session': () => ({ body: { email: 'ana@ucn.cl', roles: ['ACADEMIC_SECRETARY', 'SYSTEM_ADMIN'] } }),
    });
    renderLayout();

    expect(await screen.findByText('rol:ACADEMIC_SECRETARY')).toBeDefined();
    const navigation = screen.getByRole('navigation', { name: 'Navegación principal' });
    expect(within(navigation).getByRole('link', { current: 'page' }).getAttribute('href')).toBe('/dashboard');
    expect(within(navigation).queryByRole('link', { name: 'Usuarios' })).toBeNull();
    expect(screen.getByRole('main').closest('.dashboard-workspace')).not.toBeNull();
    expect(screen.getByRole('link', { name: 'Saltar al contenido' }).getAttribute('href')).toBe('#dashboard-main');
    expect(within(screen.getByRole('banner')).getByText('Secretario docente')).toBeDefined();
    expect(screen.queryByRole('button', { name: 'Cambiar rol activo' })).toBeNull();
    expect(replace).not.toHaveBeenCalled();
  });

  it('abre la navegación móvil como diálogo y devuelve el foco al cerrar', async () => {
    installAuthenticatedApi({
      'GET /auth/session': () => ({ body: { email: 'ana@ucn.cl', roles: ['TEACHING_SUPPORT_COORDINATOR'] } }),
    });
    renderLayout();

    const trigger = await screen.findByRole('button', { name: 'Abrir menú' });
    const mobileDialog = document.getElementById(trigger.getAttribute('aria-controls') ?? '');
    if (!(mobileDialog instanceof HTMLDialogElement)) throw new Error('No se encontró el diálogo móvil');
    mobileDialog.showModal = () => { mobileDialog.open = true; };
    mobileDialog.close = () => {
      mobileDialog.open = false;
      fireEvent(mobileDialog, new Event('close'));
    };
    trigger.focus();
    fireEvent.click(trigger);

    const dialog = screen.getByRole('dialog', { name: 'Navegación principal' });
    expect(dialog.getAttribute('id')).toBe(trigger.getAttribute('aria-controls'));
    expect(trigger.getAttribute('aria-expanded')).toBe('true');
    expect(within(dialog).getByRole('button', { name: 'Cuenta' })).toBeDefined();

    const close = within(dialog).getByRole('button', { name: 'Cerrar menú' });
    close.focus();
    fireEvent.click(close);

    await waitFor(() => expect(trigger.getAttribute('aria-expanded')).toBe('false'));
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(document.activeElement).toBe(trigger);
  });

  it('ignora un rol guardado que la sesión ya no tiene', async () => {
    localStorage.setItem('marsys_active_role', 'SYSTEM_ADMIN');
    installAuthenticatedApi({ 'GET /auth/session': () => ({ body: { email: 'ana@ucn.cl', roles: ['ACADEMIC_SECRETARY'] } }) });
    renderLayout();

    expect(await screen.findByText('rol:ACADEMIC_SECRETARY')).toBeDefined();
  });
});
