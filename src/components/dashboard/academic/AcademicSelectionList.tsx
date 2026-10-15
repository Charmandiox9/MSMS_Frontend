"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";

export default function AcademicSelectionList({
  items,
  selected,
  onChange,
  disabled = false,
}: {
  items: { id: string; title: string; description: string }[];
  selected: string[];
  onChange: (ids: string[]) => void;
  disabled?: boolean;
}) {
  const t = useTranslations("AcademicManagement");
  const [search, setSearch] = useState("");
  const visible = items.filter((item) =>
    `${item.title} ${item.description}`
      .toLocaleLowerCase()
      .includes(search.trim().toLocaleLowerCase()),
  );
  return (
    <div className="space-y-3">
      <label className="block text-xs font-semibold text-muted-foreground">
        {t("searchOptions")}
        <input
          type="search"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
        />
      </label>
      <p className="text-xs font-semibold text-primary" aria-live="polite">
        {t("selectedCount", { count: selected.length })}
      </p>
      <div className="max-h-64 overflow-y-auto rounded-xl border border-border divide-y divide-border">
        {visible.length ? (
          visible.map((item) => (
            <label
              key={item.id}
              className="flex cursor-pointer items-start gap-3 px-3 py-3 transition hover:bg-muted/40 has-checked:bg-primary/5"
            >
              <input
                type="checkbox"
                disabled={disabled}
                checked={selected.includes(item.id)}
                onChange={(event) =>
                  onChange(
                    event.target.checked
                      ? [...selected, item.id]
                      : selected.filter((id) => id !== item.id),
                  )
                }
                className="mt-1 h-4 w-4 shrink-0 accent-primary focus-visible:ring-2 focus-visible:ring-primary"
              />
              <span className="min-w-0">
                <span className="block text-sm font-semibold text-foreground">
                  {item.title}
                </span>
                <span className="block text-xs text-muted-foreground">
                  {item.description}
                </span>
              </span>
            </label>
          ))
        ) : (
          <p className="p-4 text-sm text-muted-foreground">
            {t(items.length ? "noMatches" : "emptyOptions")}
          </p>
        )}
      </div>
    </div>
  );
}
