"use client";

import { Check } from "lucide-react";
import { useId } from "react";
import type { UserRoleCode } from "@/types/auth";

export default function RoleSelectionList({
  roles,
  selectedRole,
  onSelect,
  legend,
  roleName,
}: {
  roles: readonly UserRoleCode[];
  selectedRole: UserRoleCode | null;
  onSelect: (role: UserRoleCode) => void;
  legend: string;
  roleName: (role: UserRoleCode) => string;
}) {
  const groupName = useId();

  return (
    <fieldset className="space-y-3">
      <legend className="text-base font-semibold text-foreground">{legend}</legend>
      <div className="space-y-2">
        {roles.map((role) => {
          const selected = selectedRole === role;

          return (
            <label key={role} className="block cursor-pointer">
              <input
                type="radio"
                name={groupName}
                value={role}
                checked={selected}
                onChange={() => onSelect(role)}
                className="peer sr-only"
              />
              <span
                className={`flex min-h-14 items-center gap-3 rounded-xl border px-4 py-3 transition-colors peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-focus ${
                  selected
                    ? "border-primary bg-selection"
                    : "border-border bg-card hover:border-primary/40 hover:bg-muted"
                }`}
              >
                <span
                  className={`min-w-0 flex-1 text-base font-medium ${
                    selected ? "text-foreground" : "text-muted-foreground"
                  }`}
                >
                  {roleName(role)}
                </span>
                {selected && (
                  <Check
                    aria-hidden="true"
                    className="size-5 shrink-0 text-primary"
                  />
                )}
              </span>
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}
