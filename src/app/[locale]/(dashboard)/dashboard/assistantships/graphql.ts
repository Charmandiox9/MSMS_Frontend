import { gql, type TypedDocumentNode } from "@apollo/client";
import type {
  AssistantshipView,
  AssistantshipScheduleView,
  AssistantshipSemesterOption,
  AssistantshipAssignmentOption,
  AssistantshipOptions,
  AssistantshipPage,
  AssistantshipState,
  RegisterAssistantshipInput,
  AssistantshipScheduleInput,
} from "./schema-types";
export type { AssistantshipState } from "./schema-types";
export type Assistantship = AssistantshipView;
export type Schedule = AssistantshipScheduleView;
export type SemesterOption = AssistantshipSemesterOption;
export type AssignmentOption = AssistantshipAssignmentOption;
export type Registration = RegisterAssistantshipInput & {
  schedules: AssistantshipScheduleInput[];
};
export interface Filters {
  semesterId?: string;
  teacherId?: string;
  state?: AssistantshipState;
  search: string;
  page: number;
  pageSize: number;
}
export interface HistoryData {
  assistantships: AssistantshipPage;
}
export interface OptionsData {
  assistantshipOptions: AssistantshipOptions;
}
const fields = gql`
  fragment AssistantshipFields on AssistantshipView {
    id
    teachingAssignmentId
    studentId
    courseId
    careerId
    careerName
    careerCurriculumVersionId
    assistantshipNrc
    assistantName
    assistantEmail
    studentCode
    courseName
    courseCode
    nrc
    teacherName
    semesterId
    semesterName
    approvedOn
    startsOn
    endsOn
    weeklyHours
    state
    schedules {
      weekday
      startsAtMinute
      endsAtMinute
      location
    }
  }
`;
export const HISTORY: TypedDocumentNode<HistoryData, { filters: Filters }> =
  gql`
    query Assistantships($filters: AssistantshipFilters!) {
      assistantships(filters: $filters) {
        items {
          ...AssistantshipFields
        }
        total
        assistants
        semesters
        page
        totalPages
      }
    }
    ${fields}
  `;
export const OPTIONS: TypedDocumentNode<
  OptionsData,
  Record<string, never>
> = gql`
  query AssistantshipOptions {
    assistantshipOptions {
      careers { id name isActive curriculumVersions { id cohortYear } }
      semesters {
        id
        name
        startsOn
        endsOn
        isActive
      }
      teachers {
        id
        name
      }
      blocks {
        code
        startsAtMinute
        endsAtMinute
      }
    }
  }
`;
export const STUDENT: TypedDocumentNode<
  { assistantshipStudent: import("./schema-types").AssistantshipStudentOption | null },
  { email: string }
> = gql`
  query AssistantshipStudent($email: String!) {
    assistantshipStudent(email: $email) {
      id name email careerCurriculumVersionId careerId careerName
    }
  }
`;

export const CAREER_COURSES: TypedDocumentNode<
  { assistantshipCareerCourses: import("./schema-types").AssistantshipCourseOption[] },
  { careerId: string }
> = gql`
  query AssistantshipCareerCourses($careerId: ID!) {
    assistantshipCareerCourses(careerId: $careerId) { id name code }
  }
`;
export const ASSIGNMENTS: TypedDocumentNode<
  { assistantshipAssignments: AssignmentOption[] },
  { semesterId: string }
> = gql`
  query AssistantshipAssignments($semesterId: ID!) {
    assistantshipAssignments(semesterId: $semesterId) {
      id
      courseName
      courseCode
      nrc
      teacherName
    }
  }
`;
export const REGISTER: TypedDocumentNode<
  { registerAssistantship: Assistantship },
  { input: Registration }
> = gql`
  mutation RegisterAssistantship($input: RegisterAssistantshipInput!) {
    registerAssistantship(input: $input) {
      ...AssistantshipFields
    }
  }
  ${fields}
`;

export const UPDATE: TypedDocumentNode<
  { updateAssistantship: Assistantship },
  { id: string; input: Registration }
> = gql`
  mutation UpdateAssistantship($id: ID!, $input: RegisterAssistantshipInput!) {
    updateAssistantship(id: $id, input: $input) {
      ...AssistantshipFields
    }
  }
  ${fields}
`;

export const ASSISTANTSHIP_DETAIL: TypedDocumentNode<
  { assistantship: Assistantship | null },
  { id: string }
> = gql`
  query AssistantshipDetail($id: ID!) {
    assistantship(id: $id) {
      ...AssistantshipFields
    }
  }
  ${fields}
`;
