export type JustificationStatus = 'PENDING' | 'ACCEPTED' | 'REJECTED';
export type JustificationReasonCategory = 'MEDICAL' | 'FAMILY_DEATH' | 'PERSONAL' | 'ACADEMIC' | 'OTHER';

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
}

export interface TeacherAssignment {
  id: string;
  nrc: string;
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
