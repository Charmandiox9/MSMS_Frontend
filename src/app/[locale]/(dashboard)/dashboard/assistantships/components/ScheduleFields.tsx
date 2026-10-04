"use client";
import { useTranslations } from "next-intl";
import { Plus, Trash2 } from "lucide-react";
import { buttonClass, Field, inputClass } from "./controls";
import type { AssistantshipBlockOption } from "../schema-types";
const time = (minute: number) =>
  `${String(Math.floor(minute / 60)).padStart(2, "0")}:${String(minute % 60).padStart(2, "0")}`;
export interface ScheduleDraft {
  id: string;
  weekday: string;
  block: string;
  location: string;
}
export default function ScheduleFields({
  value,
  onChange,
  blocks,
}: {
  value: ScheduleDraft[];
  onChange: (schedules: ScheduleDraft[]) => void;
  blocks: AssistantshipBlockOption[];
}) {
  const t = useTranslations("AssistantshipsPage");
  const update = (id: string, patch: Partial<ScheduleDraft>) =>
    onChange(
      value.map((item) => (item.id === id ? { ...item, ...patch } : item)),
    );
  return (
    <fieldset className="space-y-3">
      <legend className="mb-1 text-sm font-bold text-foreground">
        {t("form.schedule")}
      </legend>
      <p className="text-xs text-muted-foreground">{t("form.scheduleHint")}</p>
      {value.map((item, index) => (
        <div
          key={item.id}
          className="grid gap-3 rounded-2xl border border-border bg-background/50 p-3 sm:grid-cols-2"
        >
          <Field label={t("form.day")} htmlFor={`day-${item.id}`}>
            <select
              id={`day-${item.id}`}
              required
              className={inputClass}
              value={item.weekday}
              onChange={(event) =>
                update(item.id, { weekday: event.target.value })
              }
            >
              {[1, 2, 3, 4, 5, 6, 7].map((day) => (
                <option key={day} value={day}>
                  {t(`days.${day}`)}
                </option>
              ))}
            </select>
          </Field>
          <Field label={t("form.block")} htmlFor={`block-${item.id}`}>
            <select
              id={`block-${item.id}`}
              required
              className={inputClass}
              value={item.block}
              onChange={(event) => update(item.id, { block: event.target.value })}
            >
              <option value="">{t("form.selectBlock")}</option>
              {blocks.map((block) => (
                <option key={block.code} value={block.code}>
                  {block.code} · {time(block.startsAtMinute)}–{time(block.endsAtMinute)}
                </option>
              ))}
            </select>
          </Field>
          <Field label={t("form.location")} htmlFor={`location-${item.id}`}>
            <input
              id={`location-${item.id}`}
              className={inputClass}
              maxLength={200}
              value={item.location}
              onChange={(event) =>
                update(item.id, { location: event.target.value })
              }
            />
          </Field>
          <button
            type="button"
            className={`${buttonClass} self-end sm:justify-self-end`}
            onClick={() =>
              onChange(value.filter((schedule) => schedule.id !== item.id))
            }
            aria-label={t("form.removeSchedule", { number: index + 1 })}
          >
            <Trash2 className="h-4 w-4" />
            {t("form.remove")}
          </button>
        </div>
      ))}
      <button
        type="button"
        className={buttonClass}
        disabled={value.length >= 14 || blocks.length === 0}
        onClick={() =>
          onChange([
            ...value,
            {
              id: crypto.randomUUID(),
              weekday: "1",
              block: "",
              location: "",
            },
          ])
        }
      >
        <Plus className="h-4 w-4" />
        {t("form.addSchedule")}
      </button>
    </fieldset>
  );
}
