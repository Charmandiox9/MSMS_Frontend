import type { UserRoleCode } from "@/types/auth";
import { USER_ROLE_CODES } from "@/types/auth";

export const ACTIVE_ROLE_STORAGE_KEY = "marsys_active_role";

export function getSessionRoles(session: { roles?: unknown }): UserRoleCode[] {
  const roles: unknown[] = Array.isArray(session.roles) ? session.roles : [];
  return [
    ...new Set(
      roles.filter((role): role is UserRoleCode =>
        USER_ROLE_CODES.some((code) => code === role),
      ),
    ),
  ];
}
