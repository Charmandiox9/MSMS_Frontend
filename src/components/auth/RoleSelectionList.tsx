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
  density = "comfortable",
}: {
  roles: readonly UserRoleCode[];
  selectedRole: UserRoleCode | null;
  onSelect: (role: UserRoleCode) => void;
  legend: string;
  roleName: (role: UserRoleCode) => string;
  density?: "comfortable" | "compact";
}) {
  const groupName = useId();
  const compact = density === "compact";

  return (
    <fieldset className={compact ? "space-y-2" : "space-y-3"}>
      <legend className={compact ? "text-sm font-semibold text-foreground" : "text-base font-semibold text-foreground"}>{legend}</legend>
      <div className={compact ? "space-y-1" : "space-y-2"}>
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
                className={`flex ${compact ? "min-h-11 gap-2 rounded-lg px-3 py-2" : "min-h-14 gap-3 rounded-xl px-4 py-3"} items-center border transition-colors peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-focus ${
                  selected
                    ? "border-primary bg-selection"
                    : "border-border bg-card hover:border-primary/40 hover:bg-muted"
                }`}
              >
                <span
                  className={`min-w-0 flex-1 break-words ${compact ? "text-sm" : "text-base"} font-medium ${
                    selected ? "text-foreground" : "text-muted-foreground"
                  }`}
                >
                  {roleName(role)}
                </span>
                {selected && (
                  <Check
                    aria-hidden="true"
                    className={`${compact ? "size-4" : "size-5"} shrink-0 text-primary`}
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
