export type JustificationStatus = "PENDING" | "ACCEPTED" | "REJECTED";
export type JustificationReasonCategory =
  "MEDICAL" | "FAMILY_DEATH" | "PERSONAL" | "ACADEMIC" | "OTHER";

export interface JustificationInboxEntry {
  id: string;
  externalResponseId: string;
  studentEmail: string;
  absenceDate: string;
  subjectName: string;
  subjectCode?: string | null;
  nrc?: string | null;
  reasonCategory?: JustificationReasonCategory | null;
  reason?: string | null;
  evidenceKey: string;
  evidenceContentType: string;
  blocks?: string[] | null;
  createdAt: string;
}

export interface Justification extends JustificationInboxEntry {
  status: JustificationStatus;
  rejectionReason?: string | null;
  openedAt: string;
  decidedAt?: string | null;
  teachers?: { name: string; email: string }[];
  assistants?: { name: string; email: string }[];
  absenceBlocks?: string[];
}

export interface TeacherAssignment {
  id: string;
  nrc: string;
  course: { code: string | null; name: string };
  semester: { name: string; isActive: boolean };
}

export interface Teacher {
  id: string;
  name: string;
  email: string;
  employeeCode?: string | null;
  isActive?: boolean;
  joinedOn?: string | null;
  leftOn?: string | null;
  academicDegree?: string | null;
  professionalTitle?: string | null;
  institution?: string | null;
  assignments: TeacherAssignment[];
}

/** Respuesta paginada de GET /academic/teachers. */
export interface TeacherPage<T = Teacher> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

/** Bloque horario institucional con su hora en formato "HH:MM". */
export interface ScheduleBlock {
  code: string;
  startsAt: string;
  endsAt: string;
}

export interface TeacherScheduleEntry {
  id: string;
  /** Clase del docente o ayudantía de una de sus asignaturas. */
  kind: "COURSE" | "ASSISTANTSHIP";
  day: string;
  /** Código del bloque; '' si la ayudantía no calza con uno institucional. */
  block: string;
  /** null si la clase está en un bloque desconocido (datos antiguos). */
  startsAt: string | null;
  endsAt: string | null;
  /** NRC de la asignatura; en ayudantías, el de la asignación del docente. */
  nrc: string;
  /** NRC propio de la ayudantía, si tiene; null en clases. */
  assistantshipNrc: string | null;
  course: { id: string; code: string | null; name: string };
  location: string | null;
  /** Ayudante a cargo; null en clases. */
  assistant: { id: string; name: string; email: string } | null;
  /**
   * Estado de la ayudantía según la fecha de hoy (mismos valores que
   * AssistantshipState del módulo de ayudantías); null en clases.
   */
  state: "SCHEDULED" | "ACTIVE" | "COMPLETED" | null;
  /** true si el docente tiene otra clase (no ayudantía) en el mismo día y bloque. */
  conflict: boolean;
}

/** Respuesta de GET /academic/teachers/:id/schedule. */
export interface TeacherSchedule {
  teacher: { id: string; name: string; email: string };
  /** null si no hay semestre activo; entonces `entries` viene vacío. */
  semester: { id: string; name: string } | null;
  blocks: ScheduleBlock[];
  entries: TeacherScheduleEntry[];
}
