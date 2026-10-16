// Generated from the backend GraphQL schema. Run npm run generate:assistantship-types.

export interface AssistantshipScheduleView {
  weekday: number;
  startsAtMinute: number;
  endsAtMinute: number;
  location: string | null;
}

export interface AssistantshipView {
  id: string;
  teachingAssignmentId: string;
  assistantshipNrc: string | null;
  assistantName: string;
  assistantEmail: string;
  studentCode: string | null;
  courseName: string;
  courseCode: string | null;
  nrc: string;
  teacherName: string;
  semesterId: string;
  semesterName: string;
  approvedOn: string;
  startsOn: string;
  endsOn: string | null;
  weeklyHours: number | null;
  state: AssistantshipState;
  schedules: Array<AssistantshipScheduleView>;
}

export type AssistantshipState = "SCHEDULED" | "ACTIVE" | "COMPLETED";

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
  blocks: Array<AssistantshipBlockOption>;
  semesters: Array<AssistantshipSemesterOption>;
  teachers: Array<AssistantshipTeacherOption>;
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

export interface RegisterAssistantshipInput {
  assistantshipNrc: string;
  teachingAssignmentId: string;
  assistantName: string;
  assistantEmail: string;
  studentCode?: string | null;
  approvedOn: string;
  startsOn: string;
  endsOn: string;
  approvalConfirmed: boolean;
  weeklyHours?: number | null;
  schedules?: Array<AssistantshipScheduleInput> | null;
}

export interface AssistantshipScheduleInput {
  weekday: number;
  startsAtMinute: number;
  endsAtMinute: number;
  location?: string | null;
}
