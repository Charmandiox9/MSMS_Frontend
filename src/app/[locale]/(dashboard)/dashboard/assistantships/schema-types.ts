// Generated from the backend GraphQL schema. Run pnpm run generate:assistantship-types.

export interface AssistantshipScheduleView {
  weekday: number;
  startsAtMinute: number;
  endsAtMinute: number;
  location: string | null;
}

export interface AssistantshipView {
  scheduleNotificationSent: boolean | null;
  id: string;
  teachingAssignmentId: string | null;
  studentId: string | null;
  courseId: string;
  careerId: string | null;
  careerCurriculumVersionId: string | null;
  careerName: string | null;
  assistantshipNrc: string | null;
  assistantName: string;
  assistantEmail: string;
  studentCode: string | null;
  courseName: string;
  courseCode: string | null;
  nrc: string | null;
  teacherName: string | null;
  semesterId: string;
  semesterName: string;
  approvedOn: string;
  startsOn: string;
  endsOn: string | null;
  weeklyHours: number | null;
  tariffId: string | null;
  tariffName: string | null;
  tariffRateClp: number | null;
  estimatedAmountClp: number | null;
  state: AssistantshipState;
  schedules: Array<AssistantshipScheduleView>;
}

export type AssistantshipState = "SCHEDULED" | "ACTIVE" | "COMPLETED";

export interface AssistantshipTariffOption {
  id: string;
  semesterId: string;
  name: string;
  monthlyRateClp: number;
}

export interface AssistantshipBudgetSummary {
  semesterId: string;
  semesterName: string;
  allocatedAmountClp: number;
  occupiedAmountClp: number;
  percentage: number;
  assistantships: number;
  unpricedCount: number;
}

export interface AssistantshipPage {
  items: Array<AssistantshipView>;
  total: number;
  assistants: number;
  semesters: number;
  page: number;
  totalPages: number;
}

export interface AssistantshipSemesterOption {
  id: string;
  name: string;
  startsOn: string;
  endsOn: string;
  isActive: boolean;
}

export interface AssistantshipTeacherOption {
  id: string;
  name: string;
}

export interface AssistantshipBlockOption {
  code: string;
  startsAtMinute: number;
  endsAtMinute: number;
}

export interface AssistantshipOptions {
  careers: Array<AssistantshipCareerOption>;
  blocks: Array<AssistantshipBlockOption>;
  semesters: Array<AssistantshipSemesterOption>;
  teachers: Array<AssistantshipTeacherOption>;
}

export interface AssistantshipCurriculumOption {
  id: string;
  cohortYear: number;
}

export interface AssistantshipCareerOption {
  id: string;
  name: string;
  isActive: boolean;
  curriculumVersions: Array<AssistantshipCurriculumOption>;
}

export interface AssistantshipStudentOption {
  id: string;
  name: string;
  email: string | null;
  rut: string | null;
  careerCurriculumVersionId: string | null;
  careerId: string | null;
  careerName: string | null;
}

export interface AssistantshipCourseOption {
  id: string;
  name: string;
  code: string | null;
}

export interface AssistantshipAssignmentOption {
  id: string;
  courseName: string;
  courseCode: string | null;
  nrc: string;
  teacherName: string;
}

export interface AssistantshipFilters {
  semesterId?: string | null;
  teacherId?: string | null;
  state?: AssistantshipState | null;
  search?: string | null;
  page?: number;
  pageSize?: number;
}

export interface SaveAssistantshipTariffInput {
  id?: string | null;
  semesterId: string;
  name: string;
  monthlyRateClp: number;
}

export interface RegisterAssistantshipInput {
  notifySchedule?: boolean | null;
  applicationId?: string | null;
  assistantshipNrc: string;
  teachingAssignmentId?: string | null;
  semesterId: string;
  courseId?: string | null;
  careerId?: string | null;
  studentId: string;
  tariffId?: string | null;
  courseNrc?: string | null;
  studentCode?: string | null;
  approvedOn: string;
  startsOn: string;
  endsOn: string;
  approvalConfirmed: boolean;
  weeklyHours: number;
  schedules: Array<AssistantshipScheduleInput>;
}

export interface AssistantshipScheduleInput {
  weekday: number;
  startsAtMinute: number;
  endsAtMinute: number;
  location?: string | null;
}
