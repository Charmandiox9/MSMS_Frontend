"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import Modal from "@/components/ui/Modal";
import type { Career } from "@/types/careers";

export default function CurriculumViewer({
  career,
  onClose,
}: {
  career: Career;
  onClose: () => void;
}) {
  const t = useTranslations("CareersPage");
  const versions = [...career.curriculumVersions].sort(
    (a, b) => b.cohortYear - a.cohortYear,
  );
  const [versionId, setVersionId] = useState(versions[0]?.id ?? "");
  const version = versions.find((item) => item.id === versionId);
  const courses = version?.courses ?? [];
  const years = Array.from(
    {
      length: Math.ceil(
        Math.max(0, ...courses.map((item) => item.termNumber)) / 2,
      ),
    },
    (_, index) => index + 1,
  );
  const upperRows = Math.max(
    1,
    ...years.map(
      (year) =>
        courses.filter((item) => item.termNumber === year * 2 - 1).length,
    ),
  );
  const lowerRows = Math.max(
    1,
    ...years.map(
      (year) => courses.filter((item) => item.termNumber === year * 2).length,
    ),
  );
  const rowCount = 3 + upperRows + lowerRows;
  return (
    <Modal
      isOpen
      title={t("viewerTitle", { name: career.name })}
      description={t("viewerDescription")}
      size="full"
      closeLabel={t("close")}
      onClose={onClose}
      className="[&_h2]:whitespace-normal [&_h2]:overflow-visible"
      contentClassName="min-h-0"
    >
      {!versions.length ? (
        <p className="py-8 text-muted-foreground">{t("noCurricula")}</p>
      ) : (
        <>
          <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
            <label className="block text-sm font-semibold text-foreground">
              {t("selectCohort")}
              <select
                value={versionId}
                onChange={(event) => setVersionId(event.target.value)}
                className="mt-2 block min-h-11 min-w-48 rounded-xl border border-border bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              >
                {versions.map((item) => (
                  <option key={item.id} value={item.id}>
                    {t("cohort", { year: item.cohortYear })}
                  </option>
                ))}
              </select>
            </label>
            <p className="text-sm text-muted-foreground" aria-live="polite">
              {t("courseCount", { count: courses.length })}
            </p>
          </div>
          {!courses.length ? (
            <p className="py-8 text-muted-foreground">{t("emptyCurriculum")}</p>
          ) : (
            <>
              <p
                id="curriculum-scroll-hint"
                className="mb-3 text-sm text-muted-foreground"
              >
                {t("scrollHint")}
              </p>
              <div
                role="region"
                aria-label={t("curriculumDiagram")}
                aria-describedby="curriculum-scroll-hint"
                tabIndex={0}
                className="overflow-x-auto rounded-lg border border-border bg-background p-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary sm:p-6"
              >
                <div
                  className="grid gap-x-4 gap-y-2"
                  style={{
                    gridTemplateColumns: `repeat(${years.length}, minmax(180px, 1fr))`,
                  }}
                >
                  {years.map((year) => (
                    <section
                      key={year}
                      aria-label={t("year", { year })}
                      className="grid grid-rows-subgrid gap-y-2"
                      style={{ gridRow: `span ${rowCount}` }}
                    >
                      <h3 className="flex min-h-9 items-center justify-center bg-primary px-3 py-2 text-center text-sm font-bold uppercase tracking-wide text-primary-foreground">
                        {t("year", { year })}
                      </h3>
                      {[0, 1].map((half) => {
                        const term = year * 2 - 1 + half;
                        const items = courses.filter(
                          (item) => item.termNumber === term,
                        );
                        const rows = half === 0 ? upperRows : lowerRows;
                        return (
                          <section
                            key={term}
                            className="grid grid-rows-subgrid gap-y-2"
                            style={{ gridRow: `span ${rows + 1}` }}
                            aria-label={t("term", { term })}
                          >
                            <h4 className="py-1 text-center text-xs font-semibold tracking-wide text-primary">
                              {t("term", { term })}
                            </h4>
                            <ul
                              className="grid grid-rows-subgrid gap-y-2"
                              style={{ gridRow: `span ${rows}` }}
                            >
                              {items.length ? (
                                items.map((item) => (
                                  <li
                                    key={item.id}
                                    className="relative flex min-h-10 items-center justify-center border border-primary/60 bg-background px-2 py-1 text-center text-xs leading-4 text-foreground after:absolute after:-bottom-1 after:right-5 after:h-2 after:w-2 after:rotate-45 after:border-b after:border-r after:border-primary/60 after:bg-background"
                                  >
                                    <span className="break-words">
                                      {item.course.name}
                                      {item.course.code && (
                                        <span className="mt-0.5 block text-[10px] text-muted-foreground">
                                          {item.course.code}
                                        </span>
                                      )}
                                    </span>
                                  </li>
                                ))
                              ) : (
                                <li className="flex min-h-10 items-center justify-center px-3 text-center text-xs text-muted-foreground">
                                  {t("noTermCourses")}
                                </li>
                              )}
                            </ul>
                          </section>
                        );
                      })}
                    </section>
                  ))}
                </div>
              </div>
            </>
          )}
        </>
      )}
    </Modal>
  );
}
