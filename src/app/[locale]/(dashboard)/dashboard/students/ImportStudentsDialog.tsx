"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { FormSkeleton } from "@/components/ui/LoadingSkeletons";
import AcademicCsvImportDialog from "@/components/dashboard/academic/AcademicCsvImportDialog";
import { apiFetch } from "@/lib/api";
import { createCsv } from "@/lib/csv";
import type { CurrentCourseCatalog } from "@/types/academic";
import type { StudentImportResult } from "@/types/students";

export default function ImportStudentsDialog({
  onClose,
  onSaved,
}: {
  onClose: () => void;
  onSaved: () => void;
}) {
  const t = useTranslations("StudentsPage");
  const [catalog, setCatalog] = useState<CurrentCourseCatalog | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [retry, setRetry] = useState(0);
  const loadErrorMessage = t("errors.load");

  useEffect(() => {
    let active = true;
    apiFetch<CurrentCourseCatalog>("/academic/courses/current")
      .then((value) => {
        if (!active) return;
        setCatalog(value);
        setLoadError(null);
      })
      .catch((cause: unknown) => {
        if (active)
          setLoadError(
            cause instanceof Error ? cause.message : loadErrorMessage,
          );
      });
    return () => {
      active = false;
    };
  }, [loadErrorMessage, retry]);

  const templateContent = createCsv(
    ["nombre", "correo", "nrc1", "nrc2"],
    [
      {
        nombre: "Nombre Apellido",
        correo: "estudiante@example.com",
        nrc1: catalog?.courses[0]?.nrc ?? "NRC_EXISTENTE",
        nrc2: "",
      },
    ],
  );

  const importStudents = (csv: string) =>
    apiFetch<StudentImportResult>("/academic/students/import-csv", {
      method: "POST",
      body: JSON.stringify({ csv, semesterId: catalog?.semester?.id }),
    });

  return (
    <AcademicCsvImportDialog<StudentImportResult>
      title={t("importTitle")}
      description={t("importDescription")}
      format="nombre;correo;nrc1;nrc2;…"
      instructions={t("importRules")}
      context={
        loadError ? (
          <p role="alert" className="text-sm text-destructive">
            {loadError} {" "}
            <button
              type="button"
              onClick={() => {
                setLoadError(null);
                setRetry((value) => value + 1);
              }}
              className="font-semibold underline underline-offset-2"
            >
              {t("retry")}
            </button>
          </p>
        ) : !catalog ? (
          <FormSkeleton label={t("loading")} />
        ) : (
          <p className="text-sm font-semibold text-primary">
            {!catalog.semester
              ? t("noSemesterImport")
              : catalog.courses.length === 0
                ? t("noCoursesImport")
                : t("semester", { name: catalog.semester.name })}
          </p>
        )
      }
      template={{ fileName: "estudiantes.csv", content: templateContent }}
      fileLabel={t("file")}
      templateLabel={t("template")}
      downloadLabel={t("downloadExample")}
      cancelLabel={t("cancel")}
      submitLabel={t("import")}
      submittingLabel={t("importing")}
      closeLabel={t("close")}
      fileSizeError={t("errors.fileSize")}
      fileTypeError={t("errors.fileType")}
      importError={t("errors.import")}
      maxFileSizeBytes={2_000_000}
      canImport={
        Boolean(catalog?.semester) &&
        (catalog?.courses.length ?? 0) > 0 &&
        !loadError
      }
      onClose={onClose}
      onImport={importStudents}
      onImported={(result) => {
        toast.success(
          t("imported", {
            students: result.importedStudents,
            created: result.createdStudents,
            enrollments: result.addedEnrollments,
          }),
        );
        onSaved();
      }}
    />
  );
}
