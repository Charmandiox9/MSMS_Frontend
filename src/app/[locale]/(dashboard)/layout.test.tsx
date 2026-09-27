import { render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import DashboardLayout from './layout';
import { IntlProvider } from '@/test/render';
import { installFakeApi } from '@/test/fake-api';
import { useActiveRole } from '@/context/ActiveRoleContext';

// Referencia estable, como el router real de Next.
const router = vi.hoisted(() => ({ replace: vi.fn() }));
const { replace } = router;
vi.mock('next/navigation', () => ({ useRouter: () => router }));
vi.mock('@/components/dashboard/DashboardSidebar', () => ({ default: () => <nav>sidebar</nav> }));
vi.mock('@/components/dashboard/DashboardHeader', () => ({ default: () => <header>header</header> }));

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

    await waitFor(() => expect(replace).toHaveBeenCalledWith('/es/login'));
    expect(screen.queryByText(/rol:/)).toBeNull();
    expect(screen.queryByText('sidebar')).toBeNull();
  });

  it('si la sesión es inválida, limpia la cookie antes de ir al login', async () => {
    // Si la cookie sigue ahí, el middleware devuelve /login → /dashboard y queda en "Verificando sesión…".
    const api = installFakeApi({
      'GET /auth/session': () => ({ status: 401, body: { message: 'Usuario inválido o inactivo' } }),
      'POST /auth/logout': () => ({ status: 204 }),
    });
    renderLayout();

    await waitFor(() => expect(replace).toHaveBeenCalledWith('/es/login'));
    expect(api.requests.map((request) => `${request.method} ${request.path}`)).toEqual([
      'GET /auth/session',
      'POST /auth/logout',
    ]);
  });

  it('redirige al login si el backend está caído', async () => {
    const api = installFakeApi();
    api.on('GET /auth/session', () => Promise.reject(new TypeError('Failed to fetch')));
    renderLayout();

    await waitFor(() => expect(replace).toHaveBeenCalledWith('/es/login'));
  });

  it('con sesión renderiza el dashboard con el rol activo', async () => {
    installFakeApi({
      'GET /auth/session': () => ({ body: { email: 'ana@ucn.cl', roles: ['ACADEMIC_SECRETARY', 'SYSTEM_ADMIN'] } }),
    });
    renderLayout();

    expect(await screen.findByText('rol:ACADEMIC_SECRETARY')).toBeDefined();
    expect(screen.getByText('sidebar')).toBeDefined();
    expect(screen.getByRole('main')).toBeDefined();
    expect(replace).not.toHaveBeenCalled();
  });

  it('ignora un rol guardado que la sesión ya no tiene', async () => {
    localStorage.setItem('marsys_active_role', 'SYSTEM_ADMIN');
    installFakeApi({ 'GET /auth/session': () => ({ body: { email: 'ana@ucn.cl', roles: ['ACADEMIC_SECRETARY'] } }) });
    renderLayout();

    expect(await screen.findByText('rol:ACADEMIC_SECRETARY')).toBeDefined();
  });
});
