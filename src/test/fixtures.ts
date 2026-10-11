import type { FakeRequest, FakeResponse } from './fake-api';
import type { Justification, JustificationInboxEntry } from '@/types/justifications';

type TeacherLike = {
  name: string;
  email: string;
  employeeCode?: string | null;
  assignments: { nrc: string }[];
};

/**
 * Simula GET /academic/teachers: busca sin distinguir mayúsculas por nombre,
 * correo, código o NRC y pagina con `page`/`pageSize` como el backend.
 */
export function teachersApi<T extends TeacherLike>(teachers: T[]) {
  return ({ query }: FakeRequest): FakeResponse => {
    const page = Number(query.get('page') ?? 1);
    const pageSize = Number(query.get('pageSize') ?? 10);
    const term = (query.get('search') ?? '').toLowerCase();
    const matches = teachers.filter((teacher) =>
      [teacher.name, teacher.email, teacher.employeeCode ?? '', ...teacher.assignments.map((assignment) => assignment.nrc)]
        .some((value) => value.toLowerCase().includes(term)),
    );
    return {
      body: {
        items: matches.slice((page - 1) * pageSize, page * pageSize),
        total: matches.length,
        page,
        pageSize,
        totalPages: Math.ceil(matches.length / pageSize),
      },
    };
  };
}

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
