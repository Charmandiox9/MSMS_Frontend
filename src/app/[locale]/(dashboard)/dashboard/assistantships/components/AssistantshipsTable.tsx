"use client";
import { useFormatter, useTranslations } from "next-intl";
import type { Assistantship } from "../graphql";
import type { AssistantshipBlockOption } from "../schema-types";
const time = (minute: number) =>
  `${String(Math.floor(minute / 60)).padStart(2, "0")}:${String(minute % 60).padStart(2, "0")}`;
const stateClass = {
  ACTIVE: "bg-secondary/10 text-secondary",
  SCHEDULED: "bg-primary/10 text-primary",
  COMPLETED: "bg-muted text-muted-foreground",
};
export default function AssistantshipsTable({
  items,
  blocks,
  onEdit,
}: {
  items: Assistantship[];
  blocks: AssistantshipBlockOption[];
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
              ...(onEdit ? ["actions"] : []),
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
                <p className="font-semibold text-foreground">
                  {item.assistantName}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {item.assistantEmail}
                </p>
              </td>
              <td className="px-5 py-4">
                <p className="font-semibold text-foreground">
                  {item.courseName}
                </p>
                <p className="mt-1 text-xs tabular-nums text-primary">
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
                <p className="mb-2 font-semibold">
                  {t("form.assistantshipNrc")}: {item.assistantshipNrc ?? "—"}
                </p>
                <p>{date(item.startsOn)}</p>
                <p className="mt-1">
                  {item.endsOn ? date(item.endsOn) : t("table.noEnd")}
                </p>
                {item.weeklyHours !== null && (
                  <p className="mt-2 tabular-nums text-foreground">
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
                          <p className="mt-0.5">{schedule.location}</p>
                        )}
                      </li>
                    ))}
                  </ul>
                ) : (
                  t("table.noSchedule")
                )}
              </td>
              <td className="px-5 py-4">
                <span
                  className={`inline-flex rounded-lg px-2.5 py-1 text-xs font-semibold ${stateClass[item.state]}`}
                >
                  {t(`states.${item.state}`)}
                </span>
              </td>
              {onEdit && (
                <td className="px-5 py-4">
                  <button
                    type="button"
                    className="rounded-xl border border-border px-3 py-2 font-semibold text-primary hover:bg-primary/10"
                    onClick={() => onEdit(item)}
                  >
                    {t("edit")}
                  </button>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
