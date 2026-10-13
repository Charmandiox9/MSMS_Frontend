import type { ActiveSession, UserRoleCode } from "@/types/auth";
import { USER_ROLE_CODES } from "@/types/auth";

export const ACTIVE_ROLE_STORAGE_KEY = "marsys_active_role";

export function getSessionRoles(session: ActiveSession): UserRoleCode[] {
  return [
    ...new Set(
      session.roles.filter((role): role is UserRoleCode =>
        USER_ROLE_CODES.some((code) => code === role),
      ),
    ),
  ];
}
