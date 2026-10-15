import { useTranslations } from "next-intl";
import type {
  RepositoryFieldKey,
  RepositoryFormValues,
  RepositoryKind,
} from "@/types/academic-repository";
import { PROJECT_STATUSES } from "@/types/academic-repository";
import { fieldClass, groupsFor } from "./repository-fields";

export default function RepositoryFields({
  kind,
  values,
  onChange,
  disabled,
}: {
  kind: RepositoryKind;
  values: RepositoryFormValues;
  onChange: (key: RepositoryFieldKey, value: string) => void;
  disabled: boolean;
}) {
  const t = useTranslations("AcademicRepository");
  return (
    <>
      {groupsFor(kind).map((group) => (
        <fieldset
          key={group.key}
          disabled={disabled}
          className="rounded-2xl border border-border p-4 sm:p-5"
        >
          <legend className="px-2 text-sm font-bold text-foreground">
            {t(`groups.${group.key}`)}
          </legend>
          {group.key === "amounts" && (
            <p className="mb-4 text-xs text-muted-foreground">
              {t("amountHint")}
            </p>
          )}
          <div className="grid gap-4 sm:grid-cols-2">
            {group.fields.map((field) => {
              const id = `repository-${field.key}`;
              const label = t(`fields.${field.key}`);
              const common = {
                id,
                value: values[field.key] ?? "",
                required: field.required,
                className: fieldClass,
                onChange: (
                  event: React.ChangeEvent<
                    HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
                  >,
                ) => onChange(field.key, event.target.value),
              };
              return (
                <label
                  key={field.key}
                  htmlFor={id}
                  className={`text-sm font-medium text-foreground ${field.type === "textarea" || field.key === "title" ? "sm:col-span-2" : ""}`}
                >
                  {label}
                  {field.required && (
                    <span aria-hidden="true" className="ml-1 text-primary">
                      *
                    </span>
                  )}
                  {field.type === "textarea" ? (
                    <textarea
                      {...common}
                      rows={4}
                      maxLength={field.maxLength}
                    />
                  ) : field.type === "status" ? (
                    <select {...common}>
                      {PROJECT_STATUSES.map((status) => (
                        <option key={status} value={status}>
                          {t(`statuses.${status}`)}
                        </option>
                      ))}
                    </select>
                  ) : field.type === "boolean" ? (
                    <select {...common}>
                      <option value="">{t("unknown")}</option>
                      <option value="true">{t("yes")}</option>
                      <option value="false">{t("no")}</option>
                    </select>
                  ) : (
                    <input
                      {...common}
                      type={
                        field.type === "money" ? "text" : (field.type ?? "text")
                      }
                      inputMode={field.type === "money" ? "decimal" : undefined}
                      min={field.type === "number" ? 1900 : undefined}
                      max={field.type === "number" ? 2200 : undefined}
                      maxLength={field.maxLength ?? 200}
                      pattern={
                        field.type === "money"
                          ? "[0-9]{1,16}(\\.[0-9]{1,2})?"
                          : field.key === "currency"
                            ? "[A-Za-z]{3}"
                            : undefined
                      }
                    />
                  )}
                </label>
              );
            })}
          </div>
        </fieldset>
      ))}
    </>
  );
}
