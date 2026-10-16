import { fireEvent, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import SettingsPage from './page';
import { renderAs } from '@/test/render';
import { fail, installFakeApi, ok } from '@/test/fake-api';

vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

const SEMESTERS = [
  { id: 's-1', name: '2026-1', startsOn: '2026-03-02T00:00:00.000Z', endsOn: '2026-07-10T00:00:00.000Z', isActive: false },
  { id: 's-2', name: '2026-2', startsOn: '2026-08-03T00:00:00.000Z', endsOn: '2026-12-11T00:00:00.000Z', isActive: true },
];

describe('SettingsPage (semestre activo)', () => {
  beforeEach(() => localStorage.clear());
  afterEach(() => vi.unstubAllGlobals());

  it.each([['TEACHING_SUPPORT_COORDINATOR'], ['ACADEMIC_PROCESS_ANALYST']] as const)(
    'bloquea la vista para %s',
    async (role) => {
      const api = installFakeApi();
      renderAs(<SettingsPage />, [role]);

      expect(await screen.findByText('No tienes acceso a esta página.')).toBeDefined();
      expect(api.requests).toHaveLength(0);
    },
  );

  it('lista los semestres con sus fechas sin desfase horario', async () => {
    installFakeApi({ 'GET /academic/semesters': ok(SEMESTERS) });
    renderAs(<SettingsPage />, ['ACADEMIC_SECRETARY']);

    expect(await screen.findByText('2026-2')).toBeDefined();
    expect(screen.getByText('2026-08-03 — 2026-12-11')).toBeDefined();
    expect(screen.getByText('Activo')).toBeDefined();
    expect(screen.getByText('Inactivo')).toBeDefined();
  });

  it('activa un semestre y recarga la lista', async () => {
    const api = installFakeApi({
      'GET /academic/semesters': ok([]),
      'POST /academic/semesters/activate': ok({ id: 's-3' }),
    });
    renderAs(<SettingsPage />, ['ACADEMIC_SECRETARY']);
    await screen.findByText('Todavía no hay semestres registrados.');

    fireEvent.change(screen.getByLabelText('Nombre del semestre'), { target: { value: '2027-1' } });
    fireEvent.change(screen.getByLabelText('Fecha de inicio'), { target: { value: '2027-03-01' } });
    fireEvent.change(screen.getByLabelText('Fecha de término'), { target: { value: '2027-07-09' } });
    fireEvent.click(screen.getByRole('button', { name: 'Activar semestre' }));

    expect(await screen.findByText('El semestre 2027-1 quedó activo.')).toBeDefined();
    expect(api.calls('POST /academic/semesters/activate')[0].body).toEqual({
      name: '2027-1',
      startsOn: '2027-03-01',
      endsOn: '2027-07-09',
    });
    await waitFor(() => expect(api.calls('GET /academic/semesters')).toHaveLength(2));
  });

  it('muestra el error de validación del backend al activar', async () => {
    installFakeApi({
      'GET /academic/semesters': ok([]),
      'POST /academic/semesters/activate': fail(400, 'La fecha de término debe ser posterior al inicio'),
    });
    renderAs(<SettingsPage />, ['SYSTEM_ADMIN']);
    await screen.findByText('Todavía no hay semestres registrados.');

    fireEvent.change(screen.getByLabelText('Nombre del semestre'), { target: { value: '2027-1' } });
    fireEvent.change(screen.getByLabelText('Fecha de inicio'), { target: { value: '2027-07-09' } });
    fireEvent.change(screen.getByLabelText('Fecha de término'), { target: { value: '2027-03-01' } });
    fireEvent.click(screen.getByRole('button', { name: 'Activar semestre' }));

    expect(await screen.findByText('La fecha de término debe ser posterior al inicio')).toBeDefined();
  });
});
