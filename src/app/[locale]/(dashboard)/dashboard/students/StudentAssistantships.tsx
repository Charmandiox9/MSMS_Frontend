import { useTranslations } from "next-intl";
import type { Student } from "@/types/students";

export default function StudentAssistantships({
  items,
}: {
  items: NonNullable<Student["assistantships"]>;
}) {
  const t = useTranslations("StudentsPage");
  if (!items.length) return null;
  return (
    <details className="w-full rounded-xl border border-secondary/30 bg-secondary/5 p-3">
      <summary className="cursor-pointer text-xs font-semibold text-secondary">
        {t("assistantships", { count: items.length })}
      </summary>
      <ul className="mt-3 space-y-2 text-xs text-foreground">
        {items.map((item) => (
          <li key={item.id}>
            <p className="font-semibold">
              {item.course.name} · {item.semester.name}
            </p>
            {item.courseNrc && (
              <p className="text-muted-foreground">
                {t("assistantshipCourseNrc", { nrc: item.courseNrc })}
              </p>
            )}
            {item.nrc && (
              <p className="text-muted-foreground">
                {t("assistantshipNrc", { nrc: item.nrc })}
              </p>
            )}
          </li>
        ))}
      </ul>
    </details>
  );
}
