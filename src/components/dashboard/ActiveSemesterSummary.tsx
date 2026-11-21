"use client";

import { useEffect, useState } from "react";
import { useFormatter, useTranslations } from "next-intl";
import { CalendarDays } from "lucide-react";
import { apiFetch } from "@/lib/api";
import { useDashboardStartup } from "@/context/DashboardStartupContext";

type Semester = {
  name: string;
  startsOn: string;
  endsOn: string;
  isActive: boolean;
};

export default function ActiveSemesterSummary() {
  const t = useTranslations("Dashboard");
  const format = useFormatter();
  const { completeTask } = useDashboardStartup();
  const [semester, setSemester] = useState<
    Semester | "loading" | "error" | null
  >("loading");

  useEffect(() => {
    let current = true;
    apiFetch<Semester[]>("/academic/semesters")
      .then((semesters) => {
        if (current)
          setSemester(semesters.find(({ isActive }) => isActive) ?? null);
      })
      .catch(() => {
        if (current) setSemester("error");
      })
      .finally(() => {
        if (current) completeTask("active-semester");
      });
    return () => {
      current = false;
    };
  }, [completeTask]);

  const date = (value: string) =>
    format.dateTime(new Date(value), { dateStyle: "medium", timeZone: "UTC" });

  return (
    <p className="flex items-baseline gap-2 text-sm text-muted-foreground">
      <CalendarDays
        aria-hidden="true"
        className="size-4 shrink-0 self-center text-primary"
      />
      <span>
        {semester === "loading"
          ? t("semesterLoading")
          : semester === "error"
            ? t("semesterError")
            : semester
              ? t("semesterPeriod", {
                  name: semester.name,
                  start: date(semester.startsOn),
                  end: date(semester.endsOn),
                })
              : t("semesterEmpty")}
      </span>
    </p>
  );
}
