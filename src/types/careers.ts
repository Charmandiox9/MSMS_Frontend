export interface CareerCourse {
  id: string;
  courseId: string;
  termNumber: number;
  course: { id: string; code: string | null; name: string };
}

export interface CurriculumVersion {
  id: string;
  cohortYear: number;
  courses: CareerCourse[];
  _count: { students: number };
}

export interface Career {
  id: string;
  code: string;
  name: string;
  isActive: boolean;
  curriculumVersions: CurriculumVersion[];
}

export interface CareerOption {
  id: string;
  code: string;
  name: string;
  isActive: boolean;
  curriculumVersions: Pick<CurriculumVersion, "id" | "cohortYear">[];
}

export interface CourseOption {
  id: string;
  code: string | null;
  name: string;
}

export interface StudentCourseAttempt {
  id: string;
  attemptNumber: number;
  outcome: "PASSED" | "FAILED";
  nrc: string | null;
  courseId: string;
  course: CourseOption;
  semester: { id: string; name: string };
}

export interface StudentProgress {
  student: {
    id: string;
    name: string;
    email: string;
    curriculumVersion: (CurriculumVersion & {
      career: Pick<Career, "id" | "code" | "name">;
    }) | null;
  };
  courses: (CareerCourse & {
    outcome: "PASSED" | "FAILED" | "PENDING";
    currentEnrollment: { courseId: string; semester: { id: string; name: string } } | null;
    attempts: StudentCourseAttempt[];
  })[];
  attempts: StudentCourseAttempt[];
  summary: {
    totalCourses: number;
    passedCourses: number;
    enrolledCourses: number;
    progressPercent: number;
  };
}
