"use client";
import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { apiFetch } from "@/lib/api";
import { fieldClass } from "./repository-fields";

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
    apiFetch<Department[]>("/academic/careers/options")
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
      <label className="block text-sm font-medium">
        {t("label")}
        <select
          value={value}
          onChange={(event) => onChange(event.target.value)}
          disabled={disabled || loading || error}
          className={fieldClass}
        >
          <option value="">{t(loading ? "loading" : "unassigned")}</option>
          {departments.map((item) => (
            <option key={item.id} value={item.id}>
              {item.name}
            </option>
          ))}
        </select>
      </label>
      <p className="mt-1 text-xs text-muted-foreground">{t("hint")}</p>
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
