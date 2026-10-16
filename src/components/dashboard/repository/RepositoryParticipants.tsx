import { Plus, Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";
import type {
  RepositoryKind,
  RepositoryParticipant,
} from "@/types/academic-repository";
import type { Teacher } from "@/types/justifications";
import { fieldClass, secondaryButton } from "./repository-fields";

export default function RepositoryParticipants({
  kind,
  value,
  teachers,
  disabled,
  onChange,
}: {
  kind: RepositoryKind;
  value: RepositoryParticipant[];
  teachers: Teacher[];
  disabled: boolean;
  onChange: (value: RepositoryParticipant[]) => void;
}) {
  const t = useTranslations("AcademicRepository");
  const update = (index: number, changes: Partial<RepositoryParticipant>) =>
    onChange(
      value.map((item, i) => (i === index ? { ...item, ...changes } : item)),
    );
  return (
    <fieldset
      disabled={disabled}
      className="rounded-2xl border border-border p-4 sm:p-5"
    >
      <legend className="px-2 text-sm font-bold">
        {t("groups.participants")}
      </legend>
      <p className="mb-4 text-xs text-muted-foreground">
        {t("participantHint")}
      </p>
      <div className="space-y-4">
        {value.map((item, index) => (
          <div
            key={index}
            className="grid gap-3 rounded-xl bg-muted/40 p-3 sm:grid-cols-2"
          >
            <label className="text-sm font-medium">
              {t("fields.teacherId")}
              <select
                className={fieldClass}
                value={item.teacherId ?? ""}
                onChange={(event) => {
                  const teacher = teachers.find(
                    (row) => row.id === event.target.value,
                  );
                  update(index, {
                    teacherId: teacher?.id ?? null,
                    name: teacher?.name ?? item.name,
                    ...(kind === "projects" && teacher
                      ? { contactEmail: teacher.email }
                      : {}),
                  });
                }}
              >
                <option value="">{t("externalParticipant")}</option>
                {teachers.map((teacher) => (
                  <option key={teacher.id} value={teacher.id}>
                    {teacher.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="text-sm font-medium">
              {t("fields.name")}
              <input
                className={fieldClass}
                required
                maxLength={200}
                value={item.name}
                readOnly={!!item.teacherId}
                onChange={(event) =>
                  update(index, { name: event.target.value })
                }
              />
            </label>
            <label className="text-sm font-medium">
              {t("fields.role")}
              <input
                className={fieldClass}
                required
                maxLength={100}
                value={item.role}
                onChange={(event) =>
                  update(index, { role: event.target.value })
                }
              />
            </label>
            {kind === "projects" && (
              <>
                <label className="text-sm font-medium">
                  {t("fields.contactEmail")}
                  <input
                    className={fieldClass}
                    type="email"
                    maxLength={254}
                    value={item.contactEmail ?? ""}
                    onChange={(event) =>
                      update(index, { contactEmail: event.target.value })
                    }
                  />
                </label>
                <label className="text-sm font-medium">
                  {t("fields.gender")}
                  <input
                    className={fieldClass}
                    maxLength={100}
                    value={item.gender ?? ""}
                    onChange={(event) =>
                      update(index, { gender: event.target.value })
                    }
                  />
                </label>
              </>
            )}
            <button
              type="button"
              className={`${secondaryButton} self-end justify-self-start`}
              aria-label={t("removeParticipant", {
                name: item.name || String(index + 1),
              })}
              onClick={() => onChange(value.filter((_, i) => i !== index))}
            >
              <Trash2 className="h-4 w-4" />
              {t("remove")}
            </button>
          </div>
        ))}
      </div>
      <button
        type="button"
        disabled={value.length >= 100}
        className={`${secondaryButton} mt-4`}
        onClick={() =>
          onChange([
            ...value,
            {
              name: "",
              role: "",
              teacherId: null,
              contactEmail: null,
              gender: null,
            },
          ])
        }
      >
        <Plus className="h-4 w-4" />
        {t("addParticipant")}
      </button>
    </fieldset>
  );
}
