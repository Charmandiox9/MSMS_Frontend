import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { UserRoleCode } from "@/types/auth";
import RoleSelectionList from "./RoleSelectionList";

const roles: UserRoleCode[] = ["SYSTEM_ADMIN", "TEACHING_SUPPORT_COORDINATOR"];
const roleNames: Record<UserRoleCode, string> = {
  SYSTEM_ADMIN: "Administrador del sistema",
  ACADEMIC_SECRETARY: "Secretario docente",
  ACADEMIC_PROCESS_ANALYST: "Analista académico",
  TEACHING_SUPPORT_COORDINATOR: "Apoyo docente",
  PRIVACY_OFFICER: "Responsable de privacidad",
};

describe("RoleSelectionList", () => {
  it("exposes assigned roles as a labeled single-choice group", () => {
    render(
      <RoleSelectionList
        roles={roles}
        selectedRole="SYSTEM_ADMIN"
        onSelect={vi.fn()}
        legend="Roles disponibles"
        roleName={(role) => roleNames[role]}
      />,
    );

    expect(screen.getByRole("group", { name: "Roles disponibles" })).toBeDefined();
    expect(screen.getByRole("radio", { name: "Administrador del sistema" })).toHaveProperty("checked", true);
    expect(screen.getByRole("radio", { name: "Apoyo docente" })).toHaveProperty("checked", false);
  });

  it("reports the selected role through its callback", () => {
    const onSelect = vi.fn();
    render(
      <RoleSelectionList
        roles={roles}
        selectedRole="SYSTEM_ADMIN"
        onSelect={onSelect}
        legend="Roles disponibles"
        roleName={(role) => roleNames[role]}
      />,
    );

    fireEvent.click(screen.getByRole("radio", { name: "Apoyo docente" }));

    expect(onSelect).toHaveBeenCalledWith("TEACHING_SUPPORT_COORDINATOR");
  });
});
