"use client";

import { useId } from "react";
import { useTranslations } from "next-intl";
import type { EditorialRoleOption } from "@/features/editorial/schema-types";

export default function AudienceFields({
  roles,
  selected,
  restricted,
  disabled,
  loading,
  failed,
  onMode,
  onSelect,
}: {
  roles: EditorialRoleOption[];
  selected: string[];
  restricted: boolean;
  disabled: boolean;
  loading: boolean;
  failed: boolean;
  onMode: (restricted: boolean) => void;
  onSelect: (selected: string[]) => void;
}) {
  const t = useTranslations("Editorial");
  const id = useId();
  return (
    <fieldset
      disabled={disabled}
      className="min-w-0 space-y-2 rounded-xl border border-border p-4"
    >
      <legend className="px-1 text-sm font-bold">{t("audience.label")}</legend>
      <div className="flex flex-wrap gap-x-5">
        <label className="inline-flex min-h-12 items-center gap-2 text-sm font-medium">
          <input
            type="radio"
            name={id}
            checked={!restricted}
            onChange={() => onMode(false)}
            className="accent-primary"
          />
          {t("audience.everyone")}
        </label>
        <label className="inline-flex min-h-12 items-center gap-2 text-sm font-medium">
          <input
            type="radio"
            name={id}
            checked={restricted}
            onChange={() => onMode(true)}
            className="accent-primary"
          />
          {t("audience.selected")}
        </label>
      </div>
      {restricted && (
        <>
          {loading && (
            <p role="status" className="text-sm text-muted-foreground">
              {t("loading")}
            </p>
          )}
          {failed && (
            <p role="alert" className="text-sm text-muted-foreground">
              {t("audience.loadError")}
            </p>
          )}
          {!loading && !failed && roles.length === 0 && (
            <p role="status" className="text-sm text-muted-foreground">
              {t("audience.empty")}
            </p>
          )}
          <div className="grid gap-x-4 sm:grid-cols-2">
            {roles.map(({ code, name }) => (
              <label
                key={code}
                className="inline-flex min-h-12 items-center gap-2 text-sm"
              >
                <input
                  type="checkbox"
                  className="accent-primary"
                  checked={selected.includes(code)}
                  onChange={(event) =>
                    onSelect(
                      event.target.checked
                        ? [...selected, code]
                        : selected.filter((item) => item !== code),
                    )
                  }
                />
                {name}
              </label>
            ))}
          </div>
          <p className="text-xs text-muted-foreground">
            {t("audience.choose")}
          </p>
        </>
      )}
    </fieldset>
  );
}
