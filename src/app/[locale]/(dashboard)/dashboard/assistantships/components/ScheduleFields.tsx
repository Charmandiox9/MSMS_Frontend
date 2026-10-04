"use client";
import { useTranslations } from "next-intl";
import { Plus, Trash2 } from "lucide-react";
import { buttonClass, Field, inputClass } from "./controls";
export interface ScheduleDraft {
  id: string;
  weekday: string;
  startsAt: string;
  endsAt: string;
  location: string;
}
export default function ScheduleFields({
  value,
  onChange,
}: {
  value: ScheduleDraft[];
  onChange: (schedules: ScheduleDraft[]) => void;
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
          <div className="grid grid-cols-2 gap-3">
            <Field label={t("form.from")} htmlFor={`from-${item.id}`}>
              <input
                id={`from-${item.id}`}
                type="time"
                required
                className={inputClass}
                value={item.startsAt}
                onChange={(event) =>
                  update(item.id, { startsAt: event.target.value })
                }
              />
            </Field>
            <Field label={t("form.to")} htmlFor={`to-${item.id}`}>
              <input
                id={`to-${item.id}`}
                type="time"
                required
                className={inputClass}
                value={item.endsAt}
                onChange={(event) =>
                  update(item.id, { endsAt: event.target.value })
                }
              />
            </Field>
          </div>
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
        disabled={value.length >= 14}
        onClick={() =>
          onChange([
            ...value,
            {
              id: crypto.randomUUID(),
              weekday: "1",
              startsAt: "",
              endsAt: "",
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
