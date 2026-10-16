import type { Justification, JustificationInboxEntry } from '@/types/justifications';

// El backend guarda la fecha de inasistencia como medianoche UTC ("2026-09-15" → 00:00Z).
export function inboxEntry(overrides: Partial<JustificationInboxEntry> = {}): JustificationInboxEntry {
  return {
    id: 'inbox-1',
    externalResponseId: 'form-1',
    studentEmail: 'alumno@alumnos.ucn.cl',
    absenceDate: '2026-09-15T00:00:00.000Z',
    subjectName: 'Cálculo I',
    subjectCode: 'MAT101',
    nrc: '1234',
    reason: 'Control médico',
    evidenceKey: 'justifications/forms/evidencia.pdf',
    evidenceContentType: 'application/pdf',
    blocks: ['A', 'C2'],
    createdAt: '2026-09-15T12:00:00.000Z',
    ...overrides,
  };
}

export function justification(overrides: Partial<Justification> = {}): Justification {
  return {
    ...inboxEntry(),
    id: 'j-1',
    status: 'PENDING',
    rejectionReason: null,
    reasonCategory: null,
    openedAt: '2026-09-16T12:00:00.000Z',
    decidedAt: null,
    teachers: [{ name: 'Ana Profesora', email: 'ana@ucn.cl' }],
    ...overrides,
  };
}
