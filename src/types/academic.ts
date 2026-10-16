export interface AcademicTeacherOption {
  id: string;
  name: string;
  email: string;
}

export interface CurrentCourseCatalog {
  semester: { id: string; name: string } | null;
  courses: {
    courseId: string;
    nrc: string;
    name: string;
    code: string | null;
    teachers: AcademicTeacherOption[];
  }[];
}
