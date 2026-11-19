import { CombinedGraphQLErrors } from "@apollo/client/errors";
const codes = [
  "ACCESS_DENIED",
  "APPROVAL_REQUIRED",
  "APPROVAL_DATE",
  "INVALID_PERIOD",
  "SEMESTER_PERIOD",
  "INACTIVE_PROFILE",
  "ASSISTANT_IDENTITY",
  "APPROVAL_MISMATCH",
  "APPLICATION_UNAVAILABLE",
  "APPLICATION_STUDENT",
  "DUPLICATE",
  "SCHEDULE_CONFLICT",
  "INVALID_SCHEDULE",
  "ASSIGNMENT_NOT_FOUND",
  "RETRY",
  "CAREER_REQUIRED",
  "COURSE_CAREER",
  "TARIFF_REQUIRED",
  "INVALID_TARIFF",
  "INVALID_INPUT",
  "SERVER_ERROR",
] as const;
export function assistantshipErrorKey(error: unknown): string {
  if (CombinedGraphQLErrors.is(error)) {
    for (const graphQLError of error.errors) {
      const extensions = graphQLError.extensions;
      const original = extensions?.originalError;
      const response =
        original && typeof original === "object" && "response" in original
          ? original.response
          : undefined;
      const candidates = [
        extensions?.code,
        original && typeof original === "object" && "code" in original
          ? original.code
          : undefined,
        response && typeof response === "object" && "code" in response
          ? response.code
          : undefined,
      ];
      const code = candidates.find(
        (candidate): candidate is string =>
          typeof candidate === "string" &&
          codes.some((known) => known === candidate),
      );
      if (code) return code;
      if (extensions?.code === "BAD_USER_INPUT") return "INVALID_INPUT";
      if (extensions?.code === "INTERNAL_SERVER_ERROR") return "SERVER_ERROR";
    }
  }
  return "generic";
}
