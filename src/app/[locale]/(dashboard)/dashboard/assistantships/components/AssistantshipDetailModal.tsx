"use client";

import { useFormatter, useTranslations } from "next-intl";
import {
  BookOpen,
  Calendar,
  CalendarDays,
  Clock,
  GraduationCap,
  Mail,
  MapPin,
  Pencil,
  User,
} from "lucide-react";
import Modal from "@/components/ui/Modal";
import type { Assistantship } from "../graphql";
import type { AssistantshipBlockOption } from "../schema-types";

const time = (minute: number) =>
  `${String(Math.floor(minute / 60)).padStart(2, "0")}:${String(minute % 60).padStart(2, "0")}`;

const stateBadgeClasses = {
  ACTIVE:
    "border border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 font-semibold",
  SCHEDULED:
    "border border-primary/30 bg-primary/10 text-primary font-semibold",
  COMPLETED:
    "border border-border bg-muted/50 text-muted-foreground font-semibold",
};

interface AssistantshipDetailModalProps {
  isOpen: boolean;
  item: Assistantship | null;
  blocks: AssistantshipBlockOption[];
  onClose: () => void;
  onEdit?: (item: Assistantship) => void;
}

export default function AssistantshipDetailModal({
  isOpen,
  item,
  blocks,
  onClose,
  onEdit,
}: AssistantshipDetailModalProps) {
  const t = useTranslations("AssistantshipsPage");
  const format = useFormatter();

  if (!item) return null;

  const blockLabel = (startsAtMinute: number, endsAtMinute: number) => {
    const code = blocks.find(
      (block) =>
        block.startsAtMinute === startsAtMinute &&
        block.endsAtMinute === endsAtMinute,
    )?.code;
    return code ? `${code} · ` : "";
  };

  const formatDate = (value: string) =>
    format.dateTime(new Date(`${value}T00:00:00Z`), {
      dateStyle: "medium",
      timeZone: "UTC",
    });

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="2xl"
      eyebrow={t("detail.eyebrow")}
      title={item.assistantName}
      description={`${item.courseName}${item.courseCode ? ` · ${item.courseCode}` : ""}`}
      footer={
        <div className="flex w-full flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span className="font-semibold text-foreground">
              {t("detail.registeredNrc")}:
            </span>{" "}
            {item.assistantshipNrc ?? "—"}
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="btn-cta-secondary"
            >
              {t("form.close")}
            </button>
            {onEdit && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onEdit(item);
                }}
                className="btn-cta-primary"
              >
                <Pencil className="h-4 w-4" aria-hidden="true" />
                {t("edit")}
              </button>
            )}
          </div>
        </div>
      }
    >
      <div className="space-y-6">
        {/* Quick status bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border bg-muted/20 p-4">
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={`inline-flex items-center rounded-xl px-3 py-1 text-xs ${stateBadgeClasses[item.state]}`}
            >
              {t(`states.${item.state}`)}
            </span>
            <span className="inline-flex items-center rounded-xl border border-border bg-background px-3 py-1 text-xs font-medium text-foreground">
              {item.semesterName}
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span className="rounded-lg bg-primary/10 px-2.5 py-1 font-bold tabular-nums text-primary">
              {t("nrc", { nrc: item.nrc })}
            </span>
            {item.assistantshipNrc && (
              <span className="rounded-lg bg-secondary/15 px-2.5 py-1 font-bold tabular-nums text-secondary">
                {t("form.assistantshipNrc")}: {item.assistantshipNrc}
              </span>
            )}
          </div>
        </div>

        {/* Grid: Student + Teaching Assignment */}
        <div className="grid gap-4 sm:grid-cols-2">
          {/* Card 1: Student info */}
          <section className="rounded-2xl border border-border bg-card p-4 space-y-3">
            <div className="flex items-center gap-2 border-b border-border pb-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">
              <User className="h-4 w-4 text-primary" aria-hidden="true" />
              <span>{t("detail.studentSection")}</span>
            </div>
            <div className="space-y-2 text-sm">
              <div>
                <p className="text-xs text-muted-foreground">{t("form.name")}</p>
                <p className="font-semibold text-foreground">{item.assistantName}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">{t("form.email")}</p>
                <p className="font-mono text-xs text-foreground flex items-center gap-1.5 break-all">
                  <Mail className="h-3.5 w-3.5 text-muted-foreground shrink-0" aria-hidden="true" />
                  {item.assistantEmail}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">{t("form.studentCode")}</p>
                <p className="font-medium text-foreground flex items-center gap-1.5">
                  <GraduationCap className="h-3.5 w-3.5 text-muted-foreground shrink-0" aria-hidden="true" />
                  {item.studentCode || "—"}
                </p>
              </div>
            </div>
          </section>

          {/* Card 2: Academic & Teacher info */}
          <section className="rounded-2xl border border-border bg-card p-4 space-y-3">
            <div className="flex items-center gap-2 border-b border-border pb-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">
              <BookOpen className="h-4 w-4 text-secondary" aria-hidden="true" />
              <span>{t("detail.academicSection")}</span>
            </div>
            <div className="space-y-2 text-sm">
              <div>
                <p className="text-xs text-muted-foreground">{t("table.course")}</p>
                <p className="font-semibold text-foreground">{item.courseName}</p>
                {item.courseCode && (
                  <p className="text-xs text-muted-foreground font-mono">{item.courseCode}</p>
                )}
              </div>
              <div>
                <p className="text-xs text-muted-foreground">{t("filters.teacher")}</p>
                <p className="font-medium text-foreground">{item.teacherName}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">{t("filters.semester")}</p>
                <p className="font-medium text-foreground">{item.semesterName}</p>
              </div>
            </div>
          </section>
        </div>

        {/* Card 3: Period and Workload */}
        <section className="rounded-2xl border border-border bg-card p-4 space-y-3">
          <div className="flex items-center gap-2 border-b border-border pb-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">
            <Calendar className="h-4 w-4 text-ucn-gold" aria-hidden="true" />
            <span>{t("detail.periodSection")}</span>
          </div>
          <div className="grid gap-4 sm:grid-cols-4 text-sm">
            <div>
              <p className="text-xs text-muted-foreground">{t("form.approvedOn")}</p>
              <p className="font-semibold text-foreground">{formatDate(item.approvedOn)}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">{t("form.startsOn")}</p>
              <p className="font-semibold text-foreground">{formatDate(item.startsOn)}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">{t("form.endsOn")}</p>
              <p className="font-semibold text-foreground">
                {item.endsOn ? formatDate(item.endsOn) : t("table.noEnd")}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">{t("form.hours")}</p>
              <p className="font-semibold tabular-nums text-foreground">
                {item.weeklyHours !== null
                  ? t("table.hours", { hours: item.weeklyHours })
                  : "—"}
              </p>
            </div>
          </div>
        </section>

        {/* Card 4: Schedule breakdown */}
        <section className="rounded-2xl border border-border bg-card p-4 space-y-3">
          <div className="flex items-center gap-2 border-b border-border pb-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">
            <CalendarDays className="h-4 w-4 text-primary" aria-hidden="true" />
            <span>{t("detail.scheduleSection")}</span>
          </div>
          {item.schedules.length > 0 ? (
            <div className="grid gap-2.5 sm:grid-cols-2">
              {item.schedules.map((schedule, idx) => (
                <div
                  key={idx}
                  className="flex items-start justify-between rounded-xl border border-border/80 bg-muted/30 p-3 text-xs"
                >
                  <div className="space-y-1">
                    <p className="font-bold text-foreground">
                      {t(`days.${schedule.weekday}`)}
                    </p>
                    <p className="text-muted-foreground font-mono">
                      {blockLabel(schedule.startsAtMinute, schedule.endsAtMinute)}
                      {time(schedule.startsAtMinute)} – {time(schedule.endsAtMinute)}
                    </p>
                  </div>
                  {schedule.location && (
                    <div className="flex items-center gap-1 rounded-lg border border-border bg-card px-2 py-1 text-muted-foreground">
                      <MapPin className="h-3 w-3 text-secondary shrink-0" aria-hidden="true" />
                      <span className="truncate max-w-[120px]">{schedule.location}</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="py-2 text-xs text-muted-foreground italic">
              {t("table.noSchedule")}
            </p>
          )}
        </section>

      </div>
    </Modal>
  );
}
