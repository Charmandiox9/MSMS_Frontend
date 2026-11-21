import { useTranslations } from "next-intl";
import type { CurriculumVersion } from "@/types/careers";

export default function CurriculumPreview({ version }: { version: CurriculumVersion }) {
  const t = useTranslations("CareersPage");
  const terms = [...new Set(version.courses.map(({ termNumber }) => termNumber))].sort(
    (a, b) => a - b,
  );

  return (
    <div className="rounded-xl border border-border bg-muted/30 p-3">
      <p role="status" className="text-sm font-semibold">
        {t("existingPreview", { year: version.cohortYear, count: version.courses.length })}
      </p>
      {terms.length ? (
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          {terms.map((term) => (
            <section key={term} className="rounded-lg border border-border bg-background p-3">
              <h4 className="text-xs font-bold text-primary">{t("term", { term })}</h4>
              <ul className="mt-1 space-y-1 text-sm">
                {version.courses.filter(({ termNumber }) => termNumber === term).map(({ id, course }) => (
                  <li key={id}>
                    {course.code && <span className="text-muted-foreground">{course.code} · </span>}
                    {course.name}
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      ) : (
        <p className="mt-2 text-sm text-muted-foreground">{t("emptyCurriculum")}</p>
      )}
    </div>
  );
}
