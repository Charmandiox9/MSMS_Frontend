"use client";

import { LoaderCircle, Search, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { useId, useRef } from "react";

interface SearchFieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  help?: string;
  maxLength?: number;
  pending?: boolean;
}

export default function SearchField({
  label,
  value,
  onChange,
  placeholder,
  help,
  maxLength,
  pending = false,
}: SearchFieldProps) {
  const t = useTranslations("SearchField");
  const id = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const helpId = help ? `${id}-help` : undefined;

  function clear() {
    onChange("");
    inputRef.current?.focus();
  }

  return (
    <div className="min-w-0">
      <label htmlFor={id} className="block text-sm font-semibold text-foreground">
        {label}
      </label>
      <div className="mt-1.5 flex min-h-11 items-center gap-2 rounded-xl border border-border bg-background pl-3 text-muted-foreground transition-colors focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/30">
        {pending ? (
          <LoaderCircle className="size-4 shrink-0 motion-safe:animate-spin" aria-hidden="true" />
        ) : (
          <Search className="size-4 shrink-0" aria-hidden="true" />
        )}
        <input
          ref={inputRef}
          id={id}
          type="search"
          autoComplete="off"
          maxLength={maxLength}
          aria-describedby={helpId}
          value={value}
          placeholder={placeholder}
          onChange={(event) => onChange(event.target.value)}
          onKeyDown={(event) => {
            if (event.key !== "Escape" || !value) return;
            event.preventDefault();
            event.stopPropagation();
            clear();
          }}
          className="min-h-11 min-w-0 flex-1 bg-transparent pr-3 text-base font-normal text-foreground outline-none [&::-webkit-search-cancel-button]:appearance-none"
        />
        {value && (
          <button
            type="button"
            onClick={clear}
            aria-label={t("clear")}
            className="inline-flex size-11 shrink-0 items-center justify-center rounded-lg hover:bg-muted hover:text-foreground focus-visible:outline-2 focus-visible:outline-primary"
          >
            <X className="size-4" aria-hidden="true" />
          </button>
        )}
      </div>
      <span role="status" className="sr-only">{pending ? t("searching") : ""}</span>
      {help && (
        <p id={helpId} className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
          {help}
        </p>
      )}
    </div>
  );
}
