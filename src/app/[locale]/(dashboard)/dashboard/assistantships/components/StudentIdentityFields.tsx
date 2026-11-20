"use client";

import { useEffect, useState } from "react";
import { useQuery } from "@apollo/client/react";
import { useTranslations } from "next-intl";
import { STUDENTS, type Assistantship } from "../graphql";
import type { AssistantshipStudentOption } from "../schema-types";
import { buttonClass, Field, inputClass } from "./controls";

const formatRut = (value: string) => {
  const digits = value
    .replace(/[.\s-]/g, "")
    .replace(/[^0-9kK]/g, "")
    .toUpperCase()
    .slice(0, 9);
  if (digits.length < 2) return digits;
  const body = digits.slice(0, -1).replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  return `${body}-${digits.slice(-1)}`;
};

export function useAssistantshipStudent(initialRecord?: Pick<Assistantship, "assistantEmail" | "studentId">) {
  const [search, setSearch] = useState(initialRecord?.assistantEmail ?? "");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [selectedStudentId, setSelectedStudentId] = useState(
    initialRecord?.studentId ?? "",
  );
  useEffect(() => {
    const timeout = window.setTimeout(() => {
      setDebouncedSearch(search.trim());
    }, 250);
    return () => window.clearTimeout(timeout);
  }, [search]);
  const lookup = useQuery(STUDENTS, {
    variables: { search: debouncedSearch },
    skip: debouncedSearch.length < 2,
    fetchPolicy: "network-only",
    notifyOnNetworkStatusChange: true,
  });
  const students = lookup.data?.assistantshipStudents ?? [];
  const student = students.find(({ id }) => id === selectedStudentId) ?? null;
  const lookupReady = Boolean(student) && !lookup.loading && !lookup.error;

  return {
    search,
    setSearch: (value: string) => {
      setSearch(value);
      setSelectedStudentId("");
    },
    selectStudent: (value: AssistantshipStudentOption) =>
      setSelectedStudentId(value.id),
    students,
    student,
    lookup,
    debouncedSearch,
    lookupReady,
  };
}

export default function StudentIdentityFields({
  identity,
  onStudentChange,
}: {
  identity: ReturnType<typeof useAssistantshipStudent>;
  onStudentChange: () => void;
}) {
  const t = useTranslations("AssistantshipsPage");
  const {
    search,
    setSearch,
    selectStudent,
    students,
    student,
    lookup,
    debouncedSearch,
  } = identity;

  return (
    <div className="space-y-3 sm:col-span-2">
      <Field label={t("form.studentSearch")} htmlFor="register-student-search">
        <input
          id="register-student-search"
          type="search"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          className={inputClass}
          autoComplete="off"
          maxLength={100}
          placeholder={t("form.studentSearchPlaceholder")}
          aria-describedby="register-student-search-hint"
        />
      </Field>
      <p
        id="register-student-search-hint"
        className="text-xs text-muted-foreground"
      >
        {t("form.studentSearchHint")}
      </p>

      {debouncedSearch.length >= 2 && lookup.loading ? (
        <p role="status" className="text-sm text-muted-foreground">
          {t("loading")}
        </p>
      ) : null}
      {lookup.error ? (
        <p role="alert" className="text-sm text-danger">
          {t("errors.load")}{" "}
          <button
            type="button"
            className={buttonClass}
            onClick={() => void lookup.refetch().catch(() => undefined)}
          >
            {t("retry")}
          </button>
        </p>
      ) : null}
      {debouncedSearch.length >= 2 &&
      !lookup.loading &&
      !lookup.error &&
      !students.length ? (
        <p role="status" className="text-sm text-muted-foreground">
          {t("form.noStudentMatches")}
        </p>
      ) : null}
      {students.length > 0 ? (
        <ul
          className="max-h-52 space-y-2 overflow-y-auto rounded-xl border border-border p-2"
          aria-label={t("form.studentResults")}
        >
          {students.map((option) => (
            <li key={option.id}>
              <button
                type="button"
                className={`w-full rounded-lg border px-3 py-2 text-left text-sm transition-colors ${student?.id === option.id ? "border-primary bg-primary/10" : "border-transparent hover:bg-muted"}`}
                aria-pressed={student?.id === option.id}
                onClick={() => {
                  selectStudent(option);
                  onStudentChange();
                }}
              >
                <span className="block font-semibold text-foreground">
                  {option.name}
                </span>
                <span className="block text-xs text-muted-foreground">
                  {option.rut ? formatRut(option.rut) : t("form.noRut")} · {option.email}
                </span>
              </button>
            </li>
          ))}
        </ul>
      ) : null}

      {student ? (
        <dl
          className="grid gap-3 rounded-xl border border-secondary/30 bg-secondary/5 p-4 sm:grid-cols-2"
          aria-live="polite"
        >
          <div>
            <dt className="text-xs font-medium text-muted-foreground">
              {t("form.studentRut")}
            </dt>
            <dd className="mt-1 text-sm font-semibold text-foreground">
              {student.rut ? formatRut(student.rut) : t("form.noRut")}
            </dd>
          </div>
          <div>
            <dt className="text-xs font-medium text-muted-foreground">
              {t("form.studentFullName")}
            </dt>
            <dd className="mt-1 text-sm font-semibold text-foreground">
              {student.name}
            </dd>
          </div>
          <div>
            <dt className="text-xs font-medium text-muted-foreground">
              {t("form.studentEmail")}
            </dt>
            <dd className="mt-1 break-all text-sm font-semibold text-foreground">
              {student.email}
            </dd>
          </div>
          <div>
            <dt className="text-xs font-medium text-muted-foreground">
              {t("form.studentCareer")}
            </dt>
            <dd className="mt-1 text-sm font-semibold text-foreground">
              {student.careerName || t("form.noStudentCareer")}
            </dd>
          </div>
        </dl>
      ) : null}
    </div>
  );
}
