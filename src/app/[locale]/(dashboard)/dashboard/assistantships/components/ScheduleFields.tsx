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
    <div className="space-y-3" role="group" aria-labelledby="schedule-fields-legend">
      <div>
        <h3 id="schedule-fields-legend" className="text-sm font-bold text-foreground">
          {t("form.schedule")}
        </h3>
        <p className="mt-0.5 text-xs text-muted-foreground">{t("form.scheduleHint")}</p>
      </div>
      {value.map((item, index) => (
        <div
          key={item.id}
          className="grid gap-3.5 rounded-2xl border border-secondary/30 bg-secondary/[0.04] dark:bg-secondary/[0.08] p-4 sm:grid-cols-2 transition-all shadow-2xs hover:border-secondary/50"
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
                  {block.code.startsWith('legacy-') ? t('form.historicalBlock') : block.code} · {time(block.startsAtMinute)}–{time(block.endsAtMinute)}
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
            className="inline-flex min-h-11 items-center justify-center gap-1.5 rounded-xl border border-coral-red/30 bg-coral-red/10 px-3.5 py-2 text-xs font-bold text-coral-red transition-all hover:bg-coral-red/20 hover:border-coral-red/50 active:scale-95 self-end sm:justify-self-end cursor-pointer shadow-2xs"
            onClick={() =>
              onChange(value.filter((schedule) => schedule.id !== item.id))
            }
            aria-label={t("form.removeSchedule", { number: index + 1 })}
          >
            <Trash2 className="h-3.5 w-3.5" />
            <span>{t("form.remove")}</span>
          </button>
        </div>
      ))}
      <button
        type="button"
        className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-primary/30 bg-primary/10 px-4 py-2 text-sm font-bold text-primary transition-all hover:bg-primary/20 hover:border-primary/50 active:scale-95 disabled:opacity-50 cursor-pointer shadow-2xs"
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
        <span>{t("form.addSchedule")}</span>
      </button>
    </div>
  );
}
