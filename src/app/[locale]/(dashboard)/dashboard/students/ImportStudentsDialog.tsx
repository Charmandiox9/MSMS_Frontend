"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { FormSkeleton } from "@/components/ui/LoadingSkeletons";
import AcademicCsvImportDialog from "@/components/dashboard/academic/AcademicCsvImportDialog";
import { apiFetch } from "@/lib/api";
import type { StudentImportResult } from "@/types/students";

export default function ImportStudentsDialog({
  onClose,
  onSaved,
}: {
  onClose: () => void;
  onSaved: () => void;
}) {
  const t = useTranslations("StudentsPage");
  const [catalog, setCatalog] = useState<{ semester?: { id: string } | null } | null>(null);
  useEffect(() => {
    let active = true;
    apiFetch<{ semester?: { id: string } | null }>("/academic/courses/current")
      .then((value) => { if (active) setCatalog(value); })
      .catch(() => { if (active) setCatalog({ semester: null }); });
    return () => { active = false; };
  }, []);

  const templateContent = '"codigo_carrera";"carrera";"ADMISION";"RUT";"NOMBRE";"AP_PATERNO";"AP_MATERNO";"NIVEL_CURRICULAR";"EMAIL_ESTUDIANTE";"EMAIL_PERSONAL";"FECHA_NACIMIENTO"\n8506;"Ing. Prev. Riesgo y M.Ambiente";202610;12345678-9;"NOMBRE EJEMPLO";PÉREZ;GONZÁLEZ;8506-S01;estudiante@alumnos.ucn.cl;personal@example.com;1/15/2005\n';

  const importStudents = (csv: string) =>
    apiFetch<StudentImportResult>("/academic/students/import-csv", {
      method: "POST",
      body: JSON.stringify({ csv, ...(catalog?.semester?.id ? { semesterId: catalog.semester.id } : {}) }),
    });

  return (
    <AcademicCsvImportDialog<StudentImportResult>
      title={t("importTitle")}
      description={t("importDescription")}
      format="codigo_carrera;carrera;ADMISION;RUT;NOMBRE;AP_PATERNO;AP_MATERNO;EMAIL_ESTUDIANTE;EMAIL_PERSONAL;FECHA_NACIMIENTO"
      instructions={t("importRules")}
      context={!catalog ? <FormSkeleton label={t("loading")} /> : <p className="text-sm text-muted-foreground">{t("genericImportHint")}</p>}
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
        Boolean(catalog)
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
