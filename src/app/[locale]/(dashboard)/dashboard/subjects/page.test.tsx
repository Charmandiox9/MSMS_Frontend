import { fireEvent, screen, waitFor, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import SubjectsPage from './page';
import { renderAs } from '@/test/render';
import { fail, installFakeApi, ok } from '@/test/fake-api';

vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

const COURSES = [
  { id: 'c-1', nrc: '10001', day: 'Lunes', block: 'A', course: { code: 'ED', name: 'Estructura de Datos' }, semester: { name: '2026-2' } },
  { id: 'c-2', nrc: '10001', day: 'Miércoles', block: 'A', course: { code: 'ED', name: 'Estructura de Datos' }, semester: { name: '2026-2' } },
  { id: 'c-3', nrc: '10002', day: 'Martes', block: 'C', course: { code: 'BM', name: 'Biología Marina' }, semester: { name: '2026-2' } },
];

const TEACHERS = [
  { id: 't-1', name: 'Juan Pérez', email: 'juan@ucn.cl', assignments: [{ nrc: '10001', teacherId: 't-1' }] },
];

describe('SubjectsPage (asignaturas y horarios)', () => {
  beforeEach(() => localStorage.clear());
  afterEach(() => vi.unstubAllGlobals());

  it.each([['TEACHING_SUPPORT_COORDINATOR'], ['ACADEMIC_PROCESS_ANALYST']] as const)(
    'bloquea la vista para %s',
    async (role) => {
      const api = installFakeApi();
      renderAs(<SubjectsPage />, [role]);

      expect(await screen.findByText('No tienes acceso a esta página.')).toBeDefined();
      expect(api.requests).toHaveLength(0);
    },
  );

  it('agrupa los horarios por NRC y asocia el profesor', async () => {
    installFakeApi({ 'GET /academic/courses': ok(COURSES), 'GET /academic/teachers': ok(TEACHERS) });
    renderAs(<SubjectsPage />, ['ACADEMIC_SECRETARY']);

    const structure = await screen.findByText('Estructura de Datos');
    expect(screen.getByText('Biología Marina')).toBeDefined();
    expect(screen.getByText('Página 1 de 1 · 2 asignaturas')).toBeDefined();
    const row = structure.closest('li') ?? structure.closest('tr') ?? document.body;
    expect(within(row as HTMLElement).getByText('Juan Pérez')).toBeDefined();
    expect(screen.getByText('Sin profesor asignado')).toBeDefined();
  });

  it('filtra por día y búsqueda', async () => {
    installFakeApi({ 'GET /academic/courses': ok(COURSES), 'GET /academic/teachers': ok(TEACHERS) });
    renderAs(<SubjectsPage />, ['ACADEMIC_SECRETARY']);
    await screen.findByText('Estructura de Datos');

    fireEvent.change(screen.getByLabelText('Filtrar por día del horario'), { target: { value: 'Martes' } });
    expect(screen.queryByText('Estructura de Datos')).toBeNull();
    expect(screen.getByText('Biología Marina')).toBeDefined();

    fireEvent.change(screen.getByLabelText('Filtrar por día del horario'), { target: { value: '' } });
    fireEvent.change(screen.getByPlaceholderText('Buscar por NRC o asignatura…'), { target: { value: '10001' } });
    expect(screen.getByText('Estructura de Datos')).toBeDefined();
    expect(screen.queryByText('Biología Marina')).toBeNull();
  });

  it('importa el CSV de horarios y recarga', async () => {
    const api = installFakeApi({
      'GET /academic/courses': ok([]),
      'GET /academic/teachers': ok([]),
      'POST /academic/courses/import-csv': ok({ importedRows: 3 }),
    });
    renderAs(<SubjectsPage />, ['SYSTEM_ADMIN']);
    await screen.findByText('No hay asignaturas cargadas para el semestre activo.');

    const csv = 'nrc;asignatura;dia;bloque\n10001;Estructura de Datos;Lunes;A';
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    fireEvent.change(input, { target: { files: [new File([csv], 'horarios.csv')] } });

    await waitFor(() => expect(api.calls('GET /academic/courses')).toHaveLength(2));
    expect(api.calls('POST /academic/courses/import-csv')[0].body).toEqual({ csv });
  });

  it('muestra el error del backend al importar', async () => {
    installFakeApi({
      'GET /academic/courses': ok([]),
      'GET /academic/teachers': ok([]),
      'POST /academic/courses/import-csv': fail(400, 'Fila 3: bloque inválido'),
    });
    renderAs(<SubjectsPage />, ['SYSTEM_ADMIN']);
    await screen.findByText('No hay asignaturas cargadas para el semestre activo.');

    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    fireEvent.change(input, { target: { files: [new File(['x'], 'malo.csv')] } });

    expect((await screen.findByRole('alert')).textContent).toBe('Fila 3: bloque inválido');
  });
});
