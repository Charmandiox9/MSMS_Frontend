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
    }
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
