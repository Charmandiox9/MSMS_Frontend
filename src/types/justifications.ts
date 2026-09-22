export type JustificationStatus = 'PENDING' | 'ACCEPTED' | 'REJECTED';

export interface JustificationInboxEntry {
  id: string;
  externalResponseId: string;
  studentEmail: string;
  absenceDate: string;
  subjectName: string;
  subjectCode?: string | null;
  parallel?: string | null;
  reason?: string | null;
  evidenceKey: string;
  evidenceContentType: string;
  createdAt: string;
}

export interface Justification extends JustificationInboxEntry {
  status: JustificationStatus;
  rejectionReason?: string | null;
  openedAt: string;
  decidedAt?: string | null;
}

export interface TeacherAssignment {
  id: string;
  parallel?: string | null;
  course: { code: string; name: string };
  semester: { name: string; isActive: boolean };
}

export interface Teacher {
  id: string;
  name: string;
  email: string;
  employeeCode?: string | null;
  assignments: TeacherAssignment[];
}
