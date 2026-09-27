import { fireEvent, screen, waitFor, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import JustificationsManagementPage from './page';
import { renderAs } from '@/test/render';
import { fail, installFakeApi, ok } from '@/test/fake-api';
import { justification } from '@/test/fixtures';
import type { Justification } from '@/types/justifications';

const toast = vi.hoisted(() => ({ success: vi.fn(), error: vi.fn(), info: vi.fn() }));
vi.mock('sonner', () => ({ toast }));

const SECRETARY = ['ACADEMIC_SECRETARY'] as const;
const NEXT_PAGE = 'Página siguiente';

const HISTORY: Justification[] = [
  justification({
    id: 'j-1',
    subjectName: 'Cálculo I',
    nrc: '1111',
    studentEmail: 'ana@alumnos.ucn.cl',
    absenceDate: '2026-09-15T00:00:00.000Z',
    status: 'PENDING',
    reasonCategory: 'MEDICAL',
  }),
  justification({
    id: 'j-2',
    subjectName: 'Física II',
    nrc: '2222',
    studentEmail: 'beto@alumnos.ucn.cl',
    absenceDate: '2026-09-01T00:00:00.000Z',
    status: 'ACCEPTED',
    reasonCategory: 'MEDICAL',
  }),
  justification({
    id: 'j-3',
    subjectName: 'Química',
    nrc: '3333',
    studentEmail: 'caro@alumnos.ucn.cl',
    absenceDate: '2026-08-20T00:00:00.000Z',
    status: 'REJECTED',
    reasonCategory: 'PERSONAL',
  }),
];

function tableRows() {
  return within(screen.getByRole('table')).getAllByRole('row').slice(1);
}

function metric(label: string) {
  return screen.getByText(label).nextElementSibling?.textContent;
}

describe('JustificationsManagementPage (histórico para secretaría)', () => {
  beforeEach(() => {
    localStorage.clear();
    Object.values(toast).forEach((mock) => mock.mockClear());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it.each([['TEACHING_SUPPORT_COORDINATOR'], ['ACADEMIC_PROCESS_ANALYST']] as const)(
    'bloquea la vista y no consulta la API para %s',
    async (role) => {
      const api = installFakeApi();
      renderAs(<JustificationsManagementPage />, [role]);

      expect(await screen.findByText('No tienes acceso a esta página.')).toBeDefined();
      expect(api.requests).toHaveLength(0);
    },
  );

  it.each([['ACADEMIC_SECRETARY'], ['SYSTEM_ADMIN']] as const)('carga el histórico para %s', async (role) => {
    installFakeApi({ 'GET /justifications': ok(HISTORY) });
    renderAs(<JustificationsManagementPage />, [role]);

    await waitFor(() => expect(tableRows()).toHaveLength(3));
    expect(metric('Total recibidas')).toBe('3');
    expect(metric('Pendientes')).toBe('1');
    expect(metric('Aceptadas')).toBe('1');
    expect(metric('Rechazadas')).toBe('1');
  });

  it('muestra la fecha de inasistencia en el día que la ingresó el alumno', async () => {
    installFakeApi({ 'GET /justifications': ok([HISTORY[0]]) });
    renderAs(<JustificationsManagementPage />, [...SECRETARY]);

    await waitFor(() => expect(tableRows()).toHaveLength(1));
    // 2026-09-15 guardado como medianoche UTC; en Chile no debe verse como el 14.
    expect(within(tableRows()[0]).getByText('15-09-2026')).toBeDefined();
  });

  it('el filtro Desde/Hasta incluye las inasistencias del mismo día', async () => {
    installFakeApi({ 'GET /justifications': ok(HISTORY) });
    renderAs(<JustificationsManagementPage />, [...SECRETARY]);
    await waitFor(() => expect(tableRows()).toHaveLength(3));

    fireEvent.change(screen.getByLabelText('Desde'), { target: { value: '2026-09-15' } });
    fireEvent.change(screen.getByLabelText('Hasta'), { target: { value: '2026-09-15' } });

    expect(tableRows()).toHaveLength(1);
    expect(within(tableRows()[0]).getByText('Cálculo I')).toBeDefined();
  });

  it('agrupa las estadísticas por el mes real de la inasistencia', async () => {
    installFakeApi({
      'GET /justifications': ok([justification({ absenceDate: '2026-09-01T00:00:00.000Z' })]),
    });
    renderAs(<JustificationsManagementPage />, [...SECRETARY]);

    const months = await screen.findByRole('heading', { name: 'Meses con más solicitudes' });
    const panel = months.closest('section') as HTMLElement;
    expect(within(panel).getByText(/septiembre/)).toBeDefined();
    expect(within(panel).queryByText(/agosto/)).toBeNull();
  });

  it('filtra por estado, motivo y búsqueda, y limpia los filtros', async () => {
    installFakeApi({ 'GET /justifications': ok(HISTORY) });
    renderAs(<JustificationsManagementPage />, [...SECRETARY]);
    await waitFor(() => expect(tableRows()).toHaveLength(3));

    fireEvent.change(screen.getByLabelText('Todos los motivos'), { target: { value: 'MEDICAL' } });
    expect(tableRows()).toHaveLength(2);

    fireEvent.change(screen.getByLabelText('Todos los estados'), { target: { value: 'ACCEPTED' } });
    expect(tableRows()).toHaveLength(1);
    expect(within(tableRows()[0]).getByText('Física II')).toBeDefined();
    expect(metric('Total recibidas')).toBe('1');

    fireEvent.click(screen.getByRole('button', { name: 'Limpiar filtros' }));
    expect(tableRows()).toHaveLength(3);

    fireEvent.change(screen.getByPlaceholderText('Buscar por alumno, asignatura o NRC…'), {
      target: { value: '  3333 ' },
    });
    expect(tableRows()).toHaveLength(1);
    expect(within(tableRows()[0]).getByText('caro@alumnos.ucn.cl')).toBeDefined();

    fireEvent.change(screen.getByPlaceholderText('Buscar por alumno, asignatura o NRC…'), {
      target: { value: 'nadie' },
    });
    expect(screen.getByText('No hay justificaciones para los filtros seleccionados.')).toBeDefined();
  });

  it('pagina de a 10 y vuelve a la primera página al filtrar', async () => {
    const many = Array.from({ length: 23 }, (_, index) =>
      justification({ id: `j-${index}`, subjectName: `Ramo ${index}`, nrc: String(1000 + index) }),
    );
    installFakeApi({ 'GET /justifications': ok(many) });
    renderAs(<JustificationsManagementPage />, [...SECRETARY]);

    await waitFor(() => expect(tableRows()).toHaveLength(10));
    const next = () => screen.getByRole('button', { name: NEXT_PAGE });
    fireEvent.click(next());
    fireEvent.click(next());
    expect(tableRows()).toHaveLength(3);
    expect((next() as HTMLButtonElement).disabled).toBe(true);

    fireEvent.change(screen.getByPlaceholderText('Buscar por alumno, asignatura o NRC…'), {
      target: { value: 'Ramo 1' },
    });
    // Ramo 1 y Ramo 10–19: 11 resultados, página 1.
    expect(tableRows()).toHaveLength(10);
  });

  it('abre el detalle en modo lectura y permite abrir la evidencia', async () => {
    const open = vi.spyOn(window, 'open').mockReturnValue(null);
    installFakeApi({
      'GET /justifications': ok([HISTORY[0]]),
      'GET /justifications/j-1/evidence-url': ok({ downloadUrl: 'https://r2.test/e.pdf' }),
    });
    renderAs(<JustificationsManagementPage />, [...SECRETARY]);
    await waitFor(() => expect(tableRows()).toHaveLength(1));

    fireEvent.click(tableRows()[0]);
    const modal = screen.getByRole('dialog');
    expect(within(modal).queryByRole('button', { name: 'Aceptar' })).toBeNull();
    expect(within(modal).queryByLabelText('Motivo de la inasistencia')).toBeNull();

    fireEvent.click(within(modal).getByRole('button', { name: 'Abrir evidencia' }));
    await waitFor(() => expect(open).toHaveBeenCalledWith('https://r2.test/e.pdf', '_blank', 'noopener,noreferrer'));
  });

  it('muestra el error del backend si falla la carga', async () => {
    installFakeApi({ 'GET /justifications': fail(500, 'Internal server error') });
    renderAs(<JustificationsManagementPage />, [...SECRETARY]);

    expect(await screen.findByText('Internal server error')).toBeDefined();
    expect(toast.error).toHaveBeenCalledWith('Internal server error');
  });
});
