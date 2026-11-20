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
  email: string | null;
  givenNames?: string | null;
  rut?: string | null;
  personalEmail?: string | null;
  admission?: string | null;
  paternalSurname?: string | null;
  maternalSurname?: string | null;
  birthDate?: string | null;
  careerId?: string | null;
  career?: { id: string; code: string | null; name: string } | null;
  careerCurriculumVersionId?: string | null;
  careerCurriculumVersion?: {
    id: string;
    cohortYear: number;
    career: { id: string; code: string; name: string };
  } | null;
  enrollments: StudentEnrollment[];
  titulationProcesses?: {
    id: string;
    stage: import("@/components/dashboard/titulation/titulation-types").TitulationStage;
    outcome: import("@/components/dashboard/titulation/titulation-types").TitulationOutcome;
    careerName: string;
    degree: string | null;
    defenseDate: string | null;
    createdAt: string;
  }[];
  assistantships?: {
    id: string;
    course: { id: string; name: string; code: string | null };
    semester: { id: string; name: string };
    nrc: string | null;
    courseNrc: string | null;
    startsOn: string;
    endsOn: string | null;
  }[];
}

export interface StudentImportResult {
  importedStudents: number;
  createdStudents: number;
  addedEnrollments: number;
  semesterId: string | null;
}
