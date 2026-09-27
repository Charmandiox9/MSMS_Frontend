import { fireEvent, screen, waitFor, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import UsersPage from './page';
import { renderAs } from '@/test/render';
import { fail, installFakeApi, ok, type FakeRequest } from '@/test/fake-api';

// Sonner real: la página depende de cómo `toast.promise` propaga los errores.

const ROLES = [
  { id: 'r-admin', code: 'SYSTEM_ADMIN', name: 'Administrador del sistema' },
  { id: 'r-sec', code: 'ACADEMIC_SECRETARY', name: 'Secretaría académica' },
  { id: 'r-coord', code: 'TEACHING_SUPPORT_COORDINATOR', name: 'Coordinación de apoyo docente' },
];

type TestUser = { id: string; name: string; email: string; avatarUrl: null; isActive: boolean; roles: typeof ROLES };

function user(overrides: Partial<TestUser> = {}): TestUser {
  return {
    id: 'u-1',
    name: 'Ana Pérez',
    email: 'ana@ucn.cl',
    avatarUrl: null,
    isActive: true,
    roles: [ROLES[1]],
    ...overrides,
  };
}

function page(items: TestUser[]) {
  return { items, roles: ROLES, total: items.length, page: 1, pageSize: 10, totalPages: 1 };
}

/** Backend de usuarios con estado, para comprobar lo que la UI muestra tras cada operación. */
function usersBackend(initial: TestUser[]) {
  let users = initial.map((item) => ({ ...item, roles: [...item.roles] }));
  return {
    list: () => ({ body: page(users) }),
    assign: ({ path, body }: FakeRequest) => {
      const id = path.split('/')[2];
      const role = ROLES.find((item) => item.id === (body as { roleId: string }).roleId)!;
      users = users.map((item) => (item.id === id ? { ...item, roles: [...item.roles, role] } : item));
      return { status: 201, body: {} };
    },
  };
}

function row(name: string) {
  const item = screen.getAllByRole('listitem').find((element) => element.textContent?.includes(name));
  if (!item) throw new Error(`No hay fila para ${name}`);
  return item;
}

describe('UsersPage (administración de usuarios)', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('lista usuarios con búsqueda y filtro de rol en la consulta', async () => {
    const api = installFakeApi({
      'GET /users': ok(page([user(), user({ id: 'u-2', name: 'Beto Soto', email: 'beto@ucn.cl', isActive: false, roles: [] })])),
      'GET /users/preloads': ok({ items: [] }),
    });

    renderAs(<UsersPage />, ['SYSTEM_ADMIN']);

    expect(await screen.findByText('Ana Pérez')).toBeDefined();
    expect(within(row('Beto Soto')).getByText('Inactiva')).toBeDefined();
    expect(within(row('Beto Soto')).getByText('Sin roles asignados')).toBeDefined();
    expect(screen.getByText('2 usuarios')).toBeDefined();

    fireEvent.change(screen.getByLabelText('Buscar por nombre o correo…'), { target: { value: 'ana' } });
    fireEvent.change(screen.getByLabelText('Filtrar por rol'), { target: { value: 'ACADEMIC_SECRETARY' } });

    await waitFor(() => {
      const last = api.calls('GET /users').at(-1)!;
      expect(last.query.get('search')).toBe('ana');
      expect(last.query.get('role')).toBe('ACADEMIC_SECRETARY');
      expect(last.query.get('page')).toBe('1');
    });
  });

  it.each([['ACADEMIC_SECRETARY'], ['TEACHING_SUPPORT_COORDINATOR'], ['ACADEMIC_PROCESS_ANALYST']] as const)(
    'no muestra la administración de usuarios ni consulta la API para %s',
    async (role) => {
      const api = installFakeApi({
        'GET /users': fail(403, 'Forbidden resource'),
        'GET /users/preloads': fail(403, 'Forbidden resource'),
      });

      renderAs(<UsersPage />, [role]);

      expect(await screen.findByText('No tienes acceso a esta página.')).toBeDefined();
      await new Promise((resolve) => setTimeout(resolve, 300));
      expect(api.calls('GET /users')).toHaveLength(0);
      expect(api.calls('GET /users/preloads')).toHaveLength(0);
    },
  );

  it('asignar un rol lo muestra en la fila cuando el backend confirma', async () => {
    const backend = usersBackend([user()]);
    let releaseAssign!: () => void;
    const api = installFakeApi({
      'GET /users': backend.list,
      'GET /users/preloads': ok({ items: [] }),
      'POST /users/u-1/roles': async (request) => {
        await new Promise<void>((resolve) => (releaseAssign = resolve));
        return backend.assign(request);
      },
    });

    renderAs(<UsersPage />, ['SYSTEM_ADMIN']);
    fireEvent.click(await screen.findByRole('button', { name: 'Gestionar roles' }));

    const dialog = screen.getByRole('dialog');
    const coordinator = within(dialog).getByText('Coordinación de apoyo docente').closest('div')!.parentElement!.parentElement!;
    fireEvent.click(within(coordinator).getByRole('button', { name: 'Asignar' }));

    await waitFor(() => expect(api.calls('POST /users/u-1/roles')).toHaveLength(1));
    expect(api.calls('POST /users/u-1/roles')[0].body).toEqual({ roleId: 'r-coord' });
    // Mientras el backend no confirma, no debe recargar la lista con datos viejos.
    const reloadsBeforeConfirm = api.calls('GET /users').length;
    releaseAssign();

    await waitFor(() => expect(within(row('Ana Pérez')).getByText('Coordinación de apoyo docente')).toBeDefined());
    expect(reloadsBeforeConfirm).toBe(1);
    expect(api.calls('GET /users').length).toBeGreaterThan(reloadsBeforeConfirm);
    await new Promise((resolve) => setTimeout(resolve, 50));
    expect(within(row('Ana Pérez')).getByText('Coordinación de apoyo docente')).toBeDefined();
  });

  it('si el backend rechaza el rol, no lo muestra como asignado', async () => {
    installFakeApi({
      'GET /users': ok(page([user()])),
      'GET /users/preloads': ok({ items: [] }),
      'POST /users/u-1/roles': fail(400, 'El rol ya está asignado'),
    });

    renderAs(<UsersPage />, ['SYSTEM_ADMIN']);
    fireEvent.click(await screen.findByRole('button', { name: 'Gestionar roles' }));
    const dialog = screen.getByRole('dialog');
    const coordinator = within(dialog).getByText('Coordinación de apoyo docente').closest('div')!.parentElement!.parentElement!;
    fireEvent.click(within(coordinator).getByRole('button', { name: 'Asignar' }));

    await new Promise((resolve) => setTimeout(resolve, 50));
    expect(within(coordinator).getByRole('button', { name: 'Asignar' })).toBeDefined();
    expect(within(row('Ana Pérez')).queryByText('Coordinación de apoyo docente')).toBeNull();
  });

  it('desactivar una cuenta envía el nuevo estado', async () => {
    let active = true;
    const api = installFakeApi({
      'GET /users': () => ({ body: page([user({ isActive: active })]) }),
      'GET /users/preloads': ok({ items: [] }),
      'PATCH /users/u-1/status': ({ body }) => {
        active = (body as { isActive: boolean }).isActive;
        return { body: {} };
      },
    });

    renderAs(<UsersPage />, ['SYSTEM_ADMIN']);
    fireEvent.click(await screen.findByRole('button', { name: 'Desactivar cuenta de Ana Pérez' }));

    await waitFor(() => expect(within(row('Ana Pérez')).getByText('Inactiva')).toBeDefined());
    expect(api.calls('PATCH /users/u-1/status')[0].body).toEqual({ isActive: false });
  });

  it('si el backend impide eliminar la cuenta, la mantiene en la lista y el diálogo abierto', async () => {
    installFakeApi({
      'GET /users': ok(page([user()])),
      'GET /users/preloads': ok({ items: [] }),
      'DELETE /users/u-1': fail(409, 'El usuario tiene historial y no puede eliminarse'),
    });

    renderAs(<UsersPage />, ['SYSTEM_ADMIN']);
    fireEvent.click(await screen.findByRole('button', { name: 'Eliminar permanentemente a Ana Pérez' }));
    fireEvent.click(screen.getByRole('button', { name: 'Eliminar definitivamente' }));

    await new Promise((resolve) => setTimeout(resolve, 50));
    expect(screen.getByText('Eliminar usuario definitivamente')).toBeDefined();
    expect(screen.getByText('ana@ucn.cl')).toBeDefined();
    expect(screen.getByText('1 usuario')).toBeDefined();
  });

  it('eliminar una cuenta la quita de la lista tras confirmar', async () => {
    let users = [user(), user({ id: 'u-2', name: 'Beto Soto', email: 'beto@ucn.cl' })];
    const api = installFakeApi({
      'GET /users': () => ({ body: page(users) }),
      'GET /users/preloads': ok({ items: [] }),
      'DELETE /users/u-1': () => {
        users = users.filter((item) => item.id !== 'u-1');
        return { status: 204 };
      },
    });

    renderAs(<UsersPage />, ['SYSTEM_ADMIN']);
    fireEvent.click(await screen.findByRole('button', { name: 'Eliminar permanentemente a Ana Pérez' }));
    fireEvent.click(screen.getByRole('button', { name: 'Eliminar definitivamente' }));

    await waitFor(() => expect(screen.queryByText('Ana Pérez')).toBeNull());
    expect(screen.queryByText('Eliminar usuario definitivamente')).toBeNull();
    expect(screen.getByText('Beto Soto')).toBeDefined();
    expect(api.calls('DELETE /users/u-1')).toHaveLength(1);
  });

  it('muestra el error de carga del backend', async () => {
    installFakeApi({
      'GET /users': fail(500, 'Internal server error'),
      'GET /users/preloads': ok({ items: [] }),
    });

    renderAs(<UsersPage />, ['SYSTEM_ADMIN']);

    expect((await screen.findByRole('alert')).textContent).toBe('Internal server error');
  });
});
