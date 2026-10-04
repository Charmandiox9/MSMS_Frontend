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
  "DUPLICATE",
  "SCHEDULE_CONFLICT",
  "INVALID_SCHEDULE",
  "ASSIGNMENT_NOT_FOUND",
  "RETRY",
] as const;
export function assistantshipErrorKey(error: unknown): string {
  if (CombinedGraphQLErrors.is(error)) {
    const original = error.errors[0]?.extensions?.originalError;
    const code =
      original && typeof original === "object" && "code" in original
        ? original.code
        : undefined;
    if (typeof code === "string" && codes.some((known) => known === code))
      return code;
  }
  return "generic";
}
