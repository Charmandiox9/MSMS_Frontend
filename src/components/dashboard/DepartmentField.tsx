"use client";
import { useEffect, useId, useState } from "react";
import { useTranslations } from "next-intl";
import { apiFetch } from "@/lib/api";

type Department = { id: string; name: string };
export default function DepartmentField({
  value,
  onChange,
  disabled,
}: {
  value: string;
  onChange: (id: string) => void;
  disabled?: boolean;
}) {
  const t = useTranslations("DepartmentField");
  const id = useId();
  const [departments, setDepartments] = useState<Department[]>([]);
  const [retry, setRetry] = useState(0);
  const [requestState, setRequestState] = useState<{
    retry: number;
    status: "success" | "error";
  } | null>(null);
  const currentRequestState =
    requestState?.retry === retry ? requestState : null;
  const loading = currentRequestState === null;
  const error = currentRequestState?.status === "error";
  useEffect(() => {
    let active = true;
    apiFetch<Department[]>("/academic/departments/options")
      .then((rows) => {
        if (active) {
          setDepartments(rows);
          setRequestState({ retry, status: "success" });
        }
      })
      .catch(() => {
        if (active) setRequestState({ retry, status: "error" });
      });
    return () => {
      active = false;
    };
  }, [retry]);
  return (
    <div>
      <label htmlFor={id} className="block text-sm font-medium">
        {t("label")}
      </label>
      <p id={`${id}-hint`} className="mt-1 text-xs text-muted-foreground">
        {t(
          currentRequestState?.status === "success" && departments.length === 0
            ? "empty"
            : "hint",
        )}
      </p>
      <select
        id={id}
        name="departmentId"
        aria-describedby={`${id}-hint`}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        disabled={disabled || loading || error}
        className="mt-1 min-h-12 w-full rounded-xl border border-border bg-background px-3 text-base text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:opacity-60"
      >
        <option value="">{t(loading ? "loading" : "unassigned")}</option>
        {departments.map((item) => (
          <option key={item.id} value={item.id}>
            {item.name}
          </option>
        ))}
      </select>
      {error && (
        <p role="alert" className="mt-2 text-sm text-destructive">
          {t("error")}{" "}
          <button
            type="button"
            onClick={() => setRetry((count) => count + 1)}
            className="min-h-11 underline focus-visible:ring-2 focus-visible:ring-primary"
          >
            {t("retry")}
          </button>
        </p>
      )}
    </div>
  );
}
