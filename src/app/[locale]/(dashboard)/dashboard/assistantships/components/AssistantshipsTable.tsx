"use client";

import { Eye, Pencil } from "lucide-react";
import { useFormatter, useTranslations } from "next-intl";
import type { Assistantship } from "../graphql";
import type { AssistantshipBlockOption } from "../schema-types";

const time = (minute: number) =>
  `${String(Math.floor(minute / 60)).padStart(2, "0")}:${String(minute % 60).padStart(2, "0")}`;

const stateClass = {
  ACTIVE:
    "border border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 font-semibold",
  SCHEDULED:
    "border border-primary/30 bg-primary/10 text-primary font-semibold",
  COMPLETED:
    "border border-border bg-muted/60 text-muted-foreground font-semibold",
};

export default function AssistantshipsTable({
  items,
  blocks,
  onView,
  onEdit,
}: {
  items: Assistantship[];
  blocks: AssistantshipBlockOption[];
  onView?: (item: Assistantship) => void;
  onEdit?: (item: Assistantship) => void;
}) {
  const t = useTranslations("AssistantshipsPage");
  const format = useFormatter();

  const blockLabel = (startsAtMinute: number, endsAtMinute: number) => {
    const code = blocks.find(
      (block) =>
        block.startsAtMinute === startsAtMinute &&
        block.endsAtMinute === endsAtMinute,
    )?.code;
    return code ? `${code} · ` : "";
  };

  const date = (value: string) =>
    format.dateTime(new Date(`${value}T00:00:00Z`), {
      dateStyle: "medium",
      timeZone: "UTC",
    });

  const hasActions = Boolean(onView || onEdit);

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[900px] text-left text-sm">
        <caption className="sr-only">{t("history.title")}</caption>
        <thead className="bg-muted/40 text-xs text-muted-foreground">
          <tr>
            {[
              "assistant",
              "course",
              "semester",
              "period",
              "schedule",
              "state",
              ...(hasActions ? ["actions"] : []),
            ].map((column) => (
              <th key={column} scope="col" className="px-5 py-3 font-semibold">
                {t(`table.${column}`)}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {items.map((item) => (
            <tr
              key={item.id}
              className="align-top transition-colors hover:bg-muted/25"
            >
              <td className="px-5 py-4">
                {onView ? (
                  <button
                    type="button"
                    onClick={() => onView(item)}
                    className="text-left font-semibold text-foreground hover:text-primary transition-colors focus-visible:outline-none focus-visible:underline"
                  >
                    {item.assistantName}
                  </button>
                ) : (
                  <p className="font-semibold text-foreground">
                    {item.assistantName}
                  </p>
                )}
                <p className="mt-1 text-xs text-muted-foreground">
                  {item.assistantEmail}
                </p>
                {item.studentCode && (
                  <p className="mt-0.5 text-xs text-muted-foreground font-mono">
                    {item.studentCode}
                  </p>
                )}
              </td>
              <td className="px-5 py-4">
                <p className="font-semibold text-foreground">
                  {item.courseName}
                </p>
                <p className="mt-1 text-xs tabular-nums text-primary font-medium">
                  {t("nrc", { nrc: item.nrc })}
                  {item.courseCode && ` · ${item.courseCode}`}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {item.teacherName}
                </p>
              </td>
              <td className="px-5 py-4 font-medium text-foreground">
                {item.semesterName}
              </td>
              <td className="px-5 py-4 text-xs text-muted-foreground">
                <p className="mb-2 font-semibold text-foreground">
                  {t("form.assistantshipNrc")}: {item.assistantshipNrc ?? "—"}
                </p>
                <p>{date(item.startsOn)}</p>
                <p className="mt-1">
                  {item.endsOn ? date(item.endsOn) : t("table.noEnd")}
                </p>
                {item.weeklyHours !== null && (
                  <p className="mt-2 tabular-nums text-foreground font-medium">
                    {t("table.hours", { hours: item.weeklyHours })}
                  </p>
                )}
              </td>
              <td className="px-5 py-4 text-xs text-muted-foreground">
                {item.schedules.length ? (
                  <ul className="space-y-2">
                    {item.schedules.map((schedule, index) => (
                      <li key={index}>
                        <p className="font-medium text-foreground">
                          {t(`days.${schedule.weekday}`)} ·{" "}
                          <span className="tabular-nums">
                            {blockLabel(
                              schedule.startsAtMinute,
                              schedule.endsAtMinute,
                            )}
                            {time(schedule.startsAtMinute)}–
                            {time(schedule.endsAtMinute)}
                          </span>
                        </p>
                        {schedule.location && (
                          <p className="mt-0.5 text-muted-foreground">{schedule.location}</p>
                        )}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <span className="italic text-muted-foreground">{t("table.noSchedule")}</span>
                )}
              </td>
              <td className="px-5 py-4">
                <span
                  className={`inline-flex rounded-lg px-2.5 py-1 text-xs font-semibold ${stateClass[item.state]}`}
                >
                  {t(`states.${item.state}`)}
                </span>
              </td>
              {hasActions && (
                <td className="px-5 py-4">
                  <div className="flex flex-wrap items-center gap-1.5">
                    {onView && (
                      <button
                        type="button"
                        onClick={() => onView(item)}
                        className="inline-flex items-center gap-1.5 rounded-xl border border-secondary/30 bg-secondary/10 px-2.5 py-1.5 text-xs font-bold text-secondary hover:bg-secondary/20 hover:border-secondary/50 transition-all cursor-pointer shadow-2xs active:scale-95"
                        title={t("detail.viewDetail")}
                      >
                        <Eye className="h-3.5 w-3.5" aria-hidden="true" />
                        <span>{t("detail.viewDetail")}</span>
                      </button>
                    )}
                    {onEdit && (
                      <button
                        type="button"
                        className="inline-flex items-center gap-1.5 rounded-xl border border-primary/30 bg-primary/10 px-2.5 py-1.5 text-xs font-bold text-primary hover:bg-primary/20 hover:border-primary/50 transition-all cursor-pointer shadow-2xs active:scale-95"
                        onClick={() => onEdit(item)}
                        title={t("edit")}
                      >
                        <Pencil className="h-3.5 w-3.5" aria-hidden="true" />
                        <span>{t("edit")}</span>
                      </button>
                    )}
                  </div>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
