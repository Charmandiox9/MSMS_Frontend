import { fireEvent, screen, waitFor, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import JustificationsPage from './page';
import { renderAs } from '@/test/render';
import { fail, installFakeApi, ok } from '@/test/fake-api';
import { inboxEntry, justification } from '@/test/fixtures';

const toast = vi.hoisted(() => ({ success: vi.fn(), error: vi.fn(), info: vi.fn() }));
vi.mock('sonner', () => ({ toast }));

const COORDINATOR = ['TEACHING_SUPPORT_COORDINATOR'] as const;

function dialog() {
  return screen.getByRole('dialog');
}

function historyRow() {
  return screen.getByRole('button', { name: /Cálculo I · NRC 1234/ });
}

describe('JustificationsPage (coordinación de apoyo docente)', () => {
  beforeEach(() => {
    localStorage.clear();
    Object.values(toast).forEach((mock) => mock.mockClear());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it.each([['SYSTEM_ADMIN'], ['ACADEMIC_SECRETARY'], ['ACADEMIC_PROCESS_ANALYST']] as const)(
    'bloquea la vista y no consulta la API para %s',
    async (role) => {
      const api = installFakeApi();
      renderAs(<JustificationsPage />, [role]);

      expect(await screen.findByText('No tienes acceso a esta página.')).toBeDefined();
      expect(api.requests).toHaveLength(0);
    },
  );

  it('carga entrantes e historial con cookies y muestra los contadores', async () => {
    const api = installFakeApi({
      'GET /justifications/inbox': ok([inboxEntry()]),
      'GET /justifications': ok([
        justification({ id: 'j-1', subjectName: 'Álgebra' }),
        justification({ id: 'j-2', status: 'ACCEPTED', subjectName: 'Física' }),
      ]),
    });

    renderAs(<JustificationsPage />, [...COORDINATOR]);

    expect(await screen.findByText('Cálculo I · NRC 1234')).toBeDefined();
    expect(screen.getByText('Álgebra · NRC 1234')).toBeDefined();
    expect(screen.getAllByText('Bloque A, C2').length).toBeGreaterThan(0);
    // La fecha se muestra en el día real de la inasistencia, no corrida por la zona horaria.
    expect(screen.getAllByText(/15 sept 2026/).length).toBeGreaterThan(0);

    const counters = screen.getAllByText(/^[0-9]+$/).map((node) => node.textContent);
    expect(counters).toEqual(['1', '1', '1']);
    expect(api.requests.every((request) => request.credentials === 'include')).toBe(true);
  });

  it('abrir una entrante la registra como pendiente y abre el detalle', async () => {
    const opened = justification({ id: 'j-new', subjectName: 'Cálculo I' });
    const api = installFakeApi({
      'GET /justifications/inbox': ok([inboxEntry()]),
      'GET /justifications': ok([]),
      'POST /justifications/inbox/inbox-1/open': ok(opened),
    });

    renderAs(<JustificationsPage />, [...COORDINATOR]);
    fireEvent.click(await screen.findByRole('button', { name: /Cálculo I · NRC 1234/ }));

    const modal = await screen.findByRole('dialog');
    expect(within(modal).getByText('alumno@alumnos.ucn.cl')).toBeDefined();
    expect(within(modal).getByText('Martes, 15 de septiembre de 2026')).toBeDefined();
    expect(within(modal).getByText('Bloque A (08:10 - 09:40), Bloque C2 (13:10 - 14:30)')).toBeDefined();
    expect(within(modal).getByText('Ana Profesora')).toBeDefined();
    expect(api.calls('POST /justifications/inbox/inbox-1/open')).toHaveLength(1);
    expect(toast.info).toHaveBeenCalledWith('Justificación ingresada como pendiente.');
    expect(screen.getByText('No hay nuevas justificaciones entrantes.')).toBeDefined();
  });

  it('muestra el error del backend si no se puede abrir la entrante', async () => {
    installFakeApi({
      'GET /justifications/inbox': ok([inboxEntry()]),
      'GET /justifications': ok([]),
      'POST /justifications/inbox/inbox-1/open': fail(404, 'Entrada de formulario no encontrada'),
    });

    renderAs(<JustificationsPage />, [...COORDINATOR]);
    fireEvent.click(await screen.findByRole('button', { name: /Cálculo I · NRC 1234/ }));

    expect(await screen.findByText('Entrada de formulario no encontrada')).toBeDefined();
    expect(toast.error).toHaveBeenCalledWith('Entrada de formulario no encontrada');
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('aceptar envía la decisión con la categoría y actualiza el historial', async () => {
    const pending = justification();
    const api = installFakeApi({
      'GET /justifications/inbox': ok([]),
      'GET /justifications': ok([pending]),
      'PATCH /justifications/j-1/decision': ({ body }) => ({
        body: { ...pending, ...(body as object), decidedAt: '2026-09-17T12:00:00.000Z' },
      }),
    });

    renderAs(<JustificationsPage />, [...COORDINATOR]);
    fireEvent.click(await screen.findByRole('button', { name: /Cálculo I · NRC 1234/ }));

    const accept = within(dialog()).getByRole('button', { name: 'Aceptar' }) as HTMLButtonElement;
    expect(accept.disabled).toBe(true);
    fireEvent.change(within(dialog()).getByLabelText('Motivo de la inasistencia'), {
      target: { value: 'MEDICAL' },
    });
    expect(accept.disabled).toBe(false);
    fireEvent.click(accept);

    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
    expect(api.calls('PATCH /justifications/j-1/decision')[0].body).toEqual({
      status: 'ACCEPTED',
      reasonCategory: 'MEDICAL',
    });
    expect(toast.success).toHaveBeenCalledWith('Justificación aprobada y notificada.');
    expect(within(historyRow()).getByText('Aceptada')).toBeDefined();
  });

  it('rechazar exige motivo y lo envía recortado', async () => {
    const pending = justification();
    const api = installFakeApi({
      'GET /justifications/inbox': ok([]),
      'GET /justifications': ok([pending]),
      'PATCH /justifications/j-1/decision': ({ body }) => ({ body: { ...pending, ...(body as object) } }),
    });

    renderAs(<JustificationsPage />, [...COORDINATOR]);
    fireEvent.click(await screen.findByRole('button', { name: /Cálculo I · NRC 1234/ }));

    fireEvent.change(within(dialog()).getByLabelText('Motivo de la inasistencia'), {
      target: { value: 'PERSONAL' },
    });
    const reject = within(dialog()).getByRole('button', { name: 'Rechazar' }) as HTMLButtonElement;
    expect(reject.disabled).toBe(true);

    fireEvent.change(within(dialog()).getByLabelText(/Motivo del rechazo/), {
      target: { value: '   ' },
    });
    expect(reject.disabled).toBe(true);

    fireEvent.change(within(dialog()).getByLabelText(/Motivo del rechazo/), {
      target: { value: '  Documento ilegible  ' },
    });
    fireEvent.click(reject);

    await waitFor(() => expect(api.calls('PATCH /justifications/j-1/decision')).toHaveLength(1));
    expect(api.calls('PATCH /justifications/j-1/decision')[0].body).toEqual({
      status: 'REJECTED',
      reasonCategory: 'PERSONAL',
      rejectionReason: 'Documento ilegible',
    });
    await waitFor(() => expect(within(historyRow()).getByText('Rechazada')).toBeDefined());
    expect(toast.success).toHaveBeenCalledWith('Justificación rechazada y notificada.');
  });

  it('si otra persona ya resolvió la justificación, mantiene el modal y muestra el aviso', async () => {
    installFakeApi({
      'GET /justifications/inbox': ok([]),
      'GET /justifications': ok([justification()]),
      'PATCH /justifications/j-1/decision': fail(400, 'La justificación ya fue resuelta'),
    });

    renderAs(<JustificationsPage />, [...COORDINATOR]);
    fireEvent.click(await screen.findByRole('button', { name: /Cálculo I · NRC 1234/ }));
    fireEvent.change(within(dialog()).getByLabelText('Motivo de la inasistencia'), {
      target: { value: 'MEDICAL' },
    });
    fireEvent.click(within(dialog()).getByRole('button', { name: 'Aceptar' }));

    expect(await screen.findByText('La justificación ya fue resuelta')).toBeDefined();
    expect(toast.error).toHaveBeenCalledWith('La justificación ya fue resuelta');
    expect(screen.getByRole('dialog')).toBeDefined();
  });

  it('las resueltas se muestran sin controles de decisión', async () => {
    installFakeApi({
      'GET /justifications/inbox': ok([]),
      'GET /justifications': ok([
        justification({ status: 'REJECTED', reasonCategory: 'OTHER', rejectionReason: 'Fuera de plazo' }),
      ]),
    });

    renderAs(<JustificationsPage />, [...COORDINATOR]);
    fireEvent.click(await screen.findByRole('button', { name: /Cálculo I · NRC 1234/ }));

    expect(within(dialog()).getByText('Fuera de plazo')).toBeDefined();
    expect(within(dialog()).queryByRole('button', { name: 'Aceptar' })).toBeNull();
    expect(within(dialog()).queryByRole('button', { name: 'Rechazar' })).toBeNull();
  });

  it('abre la evidencia en una pestaña nueva sin acceso a la ventana de origen', async () => {
    const open = vi.spyOn(window, 'open').mockReturnValue(null);
    installFakeApi({
      'GET /justifications/inbox': ok([]),
      'GET /justifications': ok([justification()]),
      'GET /justifications/j-1/evidence-url': ok({ downloadUrl: 'https://r2.test/evidencia.pdf?sig=1' }),
    });

    renderAs(<JustificationsPage />, [...COORDINATOR]);
    fireEvent.click(await screen.findByRole('button', { name: /Cálculo I · NRC 1234/ }));
    fireEvent.click(within(dialog()).getByRole('button', { name: 'Abrir evidencia' }));

    await waitFor(() =>
      expect(open).toHaveBeenCalledWith('https://r2.test/evidencia.pdf?sig=1', '_blank', 'noopener,noreferrer'),
    );
  });

  it('informa si la evidencia no está disponible', async () => {
    installFakeApi({
      'GET /justifications/inbox': ok([]),
      'GET /justifications': ok([justification()]),
      'GET /justifications/j-1/evidence-url': fail(503, 'Almacenamiento no configurado'),
    });

    renderAs(<JustificationsPage />, [...COORDINATOR]);
    fireEvent.click(await screen.findByRole('button', { name: /Cálculo I · NRC 1234/ }));
    fireEvent.click(within(dialog()).getByRole('button', { name: 'Abrir evidencia' }));

    expect(await screen.findByText('Almacenamiento no configurado')).toBeDefined();
  });

  it('filtra el historial por estado', async () => {
    installFakeApi({
      'GET /justifications/inbox': ok([]),
      'GET /justifications': ok([
        justification({ id: 'j-1', subjectName: 'Álgebra' }),
        justification({ id: 'j-2', subjectName: 'Física', status: 'ACCEPTED' }),
      ]),
    });

    renderAs(<JustificationsPage />, [...COORDINATOR]);
    await screen.findByText('Álgebra · NRC 1234');

    fireEvent.click(screen.getByRole('button', { name: 'Aceptada' }));
    expect(screen.queryByText('Álgebra · NRC 1234')).toBeNull();
    expect(screen.getByText('Física · NRC 1234')).toBeDefined();

    fireEvent.click(screen.getByRole('button', { name: 'Rechazada' }));
    expect(screen.getByText('No hay justificaciones para este filtro.')).toBeDefined();
  });

  it('muestra el error de carga si el backend niega el acceso', async () => {
    installFakeApi({
      'GET /justifications/inbox': fail(403, 'Forbidden resource'),
      'GET /justifications': ok([]),
    });

    renderAs(<JustificationsPage />, [...COORDINATOR]);

    expect(await screen.findByText('Forbidden resource')).toBeDefined();
    expect(toast.error).toHaveBeenCalledWith('Forbidden resource');
  });
});
