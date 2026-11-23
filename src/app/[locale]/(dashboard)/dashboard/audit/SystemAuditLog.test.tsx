import { fireEvent, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { fail, installFakeApi, ok } from '@/test/fake-api';
import { renderAs } from '@/test/render';
import SystemAuditLog from './SystemAuditLog';

const event = {
  id: 'event-1',
  createdAt: '2026-11-23T17:00:00.000Z',
  action: 'ROLE_ASSIGNED',
  actor: { id: 'admin-1', name: 'Pat Admin' },
  target: { id: 'user-2', name: 'Alex Docente', kind: 'account' },
  roleCodes: ['SYSTEM_ADMIN'],
};
const empty = { items: [], total: 0, page: 1, pageSize: 20, totalPages: 0 };

describe('Auditoría del sistema', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('no solicita la bitácora con un rol no autorizado', () => {
    const api = installFakeApi();
    renderAs(<SystemAuditLog />, ['ACADEMIC_SECRETARY']);
    expect(screen.getByText(/Solo Administración/)).toBeDefined();
    expect(api.requests).toHaveLength(0);
  });

  it('muestra la actividad, pagina y aplica el filtro desde la primera página', async () => {
    const api = installFakeApi({
      'GET /system-audit': ({ query }) => ({
        body: query.has('action')
          ? empty
          : { items: [event], total: 21, page: Number(query.get('page')), pageSize: 20, totalPages: 2 },
      }),
    });
    renderAs(<SystemAuditLog />, ['SYSTEM_ADMIN']);

    expect(await screen.findByText('Pat Admin')).toBeDefined();
    expect(screen.getByText('Alex Docente')).toBeDefined();
    expect(screen.getByText('Administrador del sistema')).toBeDefined();
    fireEvent.click(screen.getByRole('button', { name: 'Página siguiente' }));
    await screen.findByText('Pat Admin');
    expect(api.calls('GET /system-audit').at(-1)?.query.get('page')).toBe('2');

    fireEvent.change(screen.getByLabelText('Tipo de acción'), { target: { value: 'ACCOUNT_DELETED' } });
    expect(await screen.findByText('No hay eventos de este tipo.')).toBeDefined();
    expect(api.calls('GET /system-audit').at(-1)?.query.toString()).toBe('page=1&action=ACCOUNT_DELETED');
  });

  it('permite recuperar la lista después de un error', async () => {
    const api = installFakeApi({ 'GET /system-audit': fail(500, 'Error') });
    renderAs(<SystemAuditLog />, ['SYSTEM_ADMIN']);
    expect(await screen.findByRole('alert')).toBeDefined();
    api.on('GET /system-audit', ok(empty));
    fireEvent.click(screen.getByRole('button', { name: 'Reintentar' }));
    expect(await screen.findByText('Aún no hay actividad registrada.')).toBeDefined();
  });
});
