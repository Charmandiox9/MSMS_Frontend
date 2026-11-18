import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import SearchField from "@/components/ui/SearchField";
import SearchHighlight from "@/components/ui/SearchHighlight";
import { useSearchQuery } from "@/hooks/useSearchQuery";
import { apiFetch } from "@/lib/api";
import { academicSecondaryActionClass } from "@/components/dashboard/academic/academicActionStyles";

export interface TitulationStudentOption {
  id: string;
  name: string;
  rut: string | null;
  email: string | null;
  careerId: string | null;
}
const commitSearch = () => undefined;

export default function TitulationStudentPicker({
  selectedName,
  onSelect,
}: {
  selectedName: string | null;
  onSelect: (student: TitulationStudentOption | null) => void;
}) {
  const t = useTranslations("TitulationPage.workflow");
  const { input, query, change, isWaiting, reset } =
    useSearchQuery(commitSearch);
  const [response, setResponse] = useState<{
    query: string;
    items: TitulationStudentOption[];
    error: boolean;
  } | null>(null);
  const current = response?.query === query ? response : null;

  useEffect(() => {
    if (query.length < 2 || selectedName) return;
    const controller = new AbortController();
    apiFetch<TitulationStudentOption[]>(
      "/academic/titulations/students/search",
      {
        method: "POST",
        body: JSON.stringify({ search: query }),
        cache: "no-store",
        signal: controller.signal,
      },
    )
      .then((items) => {
        if (!controller.signal.aborted)
          setResponse({ query, items, error: false });
      })
      .catch(() => {
        if (!controller.signal.aborted)
          setResponse({ query, items: [], error: true });
      });
    return () => controller.abort();
  }, [query, selectedName]);

  return (
    <section
      className="space-y-3 rounded-xl bg-muted/50 p-4"
      aria-label={t("findStudent")}
    >
      {selectedName ? (
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm font-medium text-foreground">
            {t("linkedStudent", { name: selectedName })}
          </p>
          <button
            type="button"
            className={academicSecondaryActionClass}
            onClick={() => {
              onSelect(null);
              reset();
            }}
          >
            {t("changeStudent")}
          </button>
        </div>
      ) : (
        <>
          <SearchField
            label={t("findStudent")}
            value={input}
            onChange={change}
            help={t("findStudentHelp")}
            pending={isWaiting || (query.length >= 2 && !current)}
            maxLength={100}
          />
          {current?.error ? (
            <p role="alert" className="text-sm text-danger">
              {t("findStudentError")}
            </p>
          ) : current && query.length >= 2 && current.items.length === 0 ? (
            <p role="status" className="text-sm text-muted-foreground">
              {t("studentNotFound")}
            </p>
          ) : current && query.length >= 2 ? (
            <ul className="max-h-64 overflow-y-auto divide-y divide-border rounded-xl border border-border bg-card">
              {current.items.map((student) => (
                <li key={student.id}>
                  <button
                    type="button"
                    onClick={() => onSelect(student)}
                    className="w-full space-y-1 p-3 text-start hover:bg-muted focus-visible:outline-2 focus-visible:outline-primary"
                  >
                    <span className="block text-base font-medium text-foreground">
                      <SearchHighlight text={student.name} query={query} />
                    </span>
                    <span className="block text-sm text-muted-foreground">
                      {student.rut ||
                        student.email ||
                        t("studentWithoutIdentifiers")}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          ) : null}
        </>
      )}
    </section>
  );
}
