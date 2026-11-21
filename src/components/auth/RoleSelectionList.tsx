"use client";

import { Check, ChevronRight } from "lucide-react";
import { useId } from "react";
import type { UserRoleCode } from "@/types/auth";

export default function RoleSelectionList({
  roles,
  selectedRole,
  onSelect,
  legend,
  roleName,
  density = "comfortable",
  currentRoleStatus,
}: {
  roles: readonly UserRoleCode[];
  selectedRole: UserRoleCode | null;
  onSelect: (role: UserRoleCode) => void;
  legend: string;
  roleName: (role: UserRoleCode) => string;
  density?: "comfortable" | "compact";
  currentRoleStatus?: string;
}) {
  const groupName = useId();
  const compact = density === "compact";

  if (currentRoleStatus && selectedRole) {
    return (
      <div
        role="group"
        aria-label={legend}
        className={compact ? "space-y-1" : "space-y-2"}
      >
        <div
          aria-current="true"
          className={`flex ${compact ? "min-h-11 gap-2 rounded-lg px-3 py-2" : "min-h-14 gap-3 rounded-xl px-4 py-3"} items-center bg-selection`}
        >
          <span className={`min-w-0 flex-1 break-words ${compact ? "text-sm" : "text-base"} font-medium text-foreground`}>
            {roleName(selectedRole)}
          </span>
          <span className="inline-flex shrink-0 items-center gap-1 text-xs font-semibold text-muted-foreground">
            <Check aria-hidden="true" className="size-4 text-primary" />
            {currentRoleStatus}
          </span>
        </div>
        {roles.filter((role) => role !== selectedRole).map((role) => (
          <button
            key={role}
            type="button"
            onClick={() => onSelect(role)}
            className={`flex ${compact ? "min-h-11 gap-2 rounded-lg px-3 py-2" : "min-h-14 gap-3 rounded-xl px-4 py-3"} w-full items-center text-left text-foreground transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus`}
          >
            <span className={`min-w-0 flex-1 break-words ${compact ? "text-sm" : "text-base"} font-medium`}>
              {roleName(role)}
            </span>
            <ChevronRight aria-hidden="true" className="size-4 shrink-0 text-muted-foreground" />
          </button>
        ))}
      </div>
    );
  }

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
