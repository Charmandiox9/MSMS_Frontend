import { fireEvent, screen, waitFor, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { toast } from 'sonner';
import { renderAs } from '@/test/render';
import { fail, installFakeApi, ok } from '@/test/fake-api';
import type { ResearchOutputRecord } from '@/types/research-output';
import ResearchOutputsPage from './ResearchOutputsPage';

vi.mock('sonner', () => ({ toast: { error: vi.fn(), promise: vi.fn(), success: vi.fn() } }));
const id = '22222222-2222-4222-8222-222222222222';
const version = '2026-10-14T12:00:00.123Z';
const record: ResearchOutputRecord = {
  id, researchId: id, kind: 'ARTICLE', reportingYear: 2026, title: 'Publicación costera',
  doi: null, journal: null, issn: null, isbn: null, quartile: null, fiveYearImpactFactor: null,
  publicationDate: null, indexation: null, publisher: null, publicationPlace: null,
  studentParticipation: null, internationalParticipation: null, intellectualPropertyType: null,
  phase: null, phaseDate: null, notes: null, updatedAt: version, createdAt: version,
  research: { id, title: 'Investigación costera', code: null }, authors: [], projects: [],
};
const page = (items: unknown[]) => ({ items, total: items.length, page: 1, pageSize: 10, totalPages: 1 });
const routes = () => ({
  'GET /academic/research-outputs': ok(page([record])),
  'GET /academic/research': ok(page([{ id, title: 'Investigación costera', code: null, academicUnit: 'FCM',
    startsOn: null, endsOn: null, updatedAt: version, createdAt: version, reportingYear: null, status: null,
    participants: [], _count: { outputs: 1 } }])),
});

describe('detalles GraphQL de resultados académicos', () => {
  beforeEach(() => { localStorage.clear(); vi.clearAllMocks(); });
  afterEach(() => vi.unstubAllGlobals());

  it.each(['SYSTEM_ADMIN', 'ACADEMIC_SECRETARY', 'ACADEMIC_PROCESS_ANALYST'] as const)(
    'abre el detalle vigente y guarda esa versión con %s', async (role) => {
      const latestVersion = '2026-10-14T12:30:00.456Z';
      const latest = { ...record, title: 'Publicación actualizada', updatedAt: latestVersion, notes: 'Notas vigentes' };
      const api = installFakeApi({ ...routes(), [`GET /academic/research-outputs/${id}`]: ok(latest),
        [`PUT /academic/research-outputs/${id}`]: ok(latest) });
      renderAs(<ResearchOutputsPage />, [role]);
      await screen.findByText(record.title);
      fireEvent.click(screen.getByRole('button', { name: `Editar ${record.title}` }));
      const dialog = await screen.findByRole('dialog');
      expect(within(dialog).getByDisplayValue(latest.title)).toBeDefined();
      expect(within(dialog).getByDisplayValue(latest.notes)).toBeDefined();
      expect(api.calls(`GET /academic/research-outputs/${id}`)[0]).toMatchObject({
        operationName: 'RepositoryResearchOutputDetail', credentials: 'include' });
      fireEvent.submit(dialog.querySelector('form')!);
      await waitFor(() => expect(api.calls(`PUT /academic/research-outputs/${id}`)).toHaveLength(1));
      expect(api.calls(`PUT /academic/research-outputs/${id}`)[0].body).toMatchObject({ expectedUpdatedAt: latestVersion });
    },
  );

  it('conserva la lista y muestra un toast si el detalle fue eliminado', async () => {
    installFakeApi({ ...routes(), [`GET /academic/research-outputs/${id}`]: fail(404, 'Resultado no encontrado') });
    renderAs(<ResearchOutputsPage />, ['ACADEMIC_SECRETARY']);
    await screen.findByText(record.title);
    fireEvent.click(screen.getByRole('button', { name: record.title }));
    await waitFor(() => expect(toast.error).toHaveBeenCalledWith('Resultado no encontrado'));
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(screen.getByText(record.title)).toBeDefined();
  });

  it('bloquea coordinación sin consultar GraphQL', async () => {
    const api = installFakeApi();
    renderAs(<ResearchOutputsPage />, ['TEACHING_SUPPORT_COORDINATOR']);
    await screen.findByText('No tienes acceso a esta página.');
    expect(api.requests).toHaveLength(0);
  });
});
