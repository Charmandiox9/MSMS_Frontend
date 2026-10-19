export interface StudentEnrollment {
  id: string;
  nrc: string;
  courseId: string;
  semesterId: string;
  course: { id: string; name: string; code: string | null };
  semester: { id: string; name: string; isActive: boolean };
}

export interface Student {
  id: string;
  name: string;
  email: string;
  careerCurriculumVersionId?: string | null;
  careerCurriculumVersion?: {
    id: string;
    cohortYear: number;
    career: { id: string; code: string; name: string };
  } | null;
  enrollments: StudentEnrollment[];
}

export interface StudentImportResult {
  importedStudents: number;
  createdStudents: number;
  addedEnrollments: number;
  semesterId: string;
}
