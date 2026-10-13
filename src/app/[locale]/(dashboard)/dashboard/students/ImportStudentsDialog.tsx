"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import Modal from "@/components/ui/Modal";
import { FormSkeleton } from "@/components/ui/LoadingSkeletons";
import { apiFetch } from "@/lib/api";
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
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [retry, setRetry] = useState(0);
  const loadError = t("errors.load");
  useEffect(() => {
    let active = true;
    apiFetch<CurrentCourseCatalog>("/academic/courses/current")
      .then((value) => {
        if (active) {
          setCatalog(value);
          setError(null);
        }
      })
      .catch((cause: unknown) => {
        if (active)
          setError(cause instanceof Error ? cause.message : loadError);
      });
    return () => {
      active = false;
    };
  }, [loadError, retry]);
  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (!file || !catalog?.semester || saving) return;
    if (file.size > 2_000_000) {
      setError(t("errors.fileSize"));
      return;
    }
    setSaving(true);
    setError(null);
    const operation = file
      .text()
      .then((csv) =>
        apiFetch<StudentImportResult>("/academic/students/import-csv", {
          method: "POST",
          body: JSON.stringify({ csv, semesterId: catalog.semester!.id }),
        }),
      );
    toast.promise(operation, {
      loading: t("importing"),
      success: (result) =>
        t("imported", {
          students: result.importedStudents,
          created: result.createdStudents,
          enrollments: result.addedEnrollments,
        }),
      error: (cause: unknown) =>
        cause instanceof Error ? cause.message : t("errors.import"),
    });
    try {
      await operation;
      onSaved();
    } catch (cause: unknown) {
      setError(cause instanceof Error ? cause.message : t("errors.import"));
    } finally {
      setSaving(false);
    }
  };
  const download = () => {
    const first = catalog?.courses[0]?.nrc ?? "";
    const content = `nombre;correo;nrc1;nrc2\nNombre Apellido;estudiante@example.com;${first};`;
    const url = URL.createObjectURL(
      new Blob(["\uFEFF", content], { type: "text/csv;charset=utf-8" }),
    );
    const link = document.createElement("a");
    link.href = url;
    link.download = "estudiantes.csv";
    link.click();
    URL.revokeObjectURL(url);
    toast.success(t("exampleDownloaded"));
  };
  return (
    <Modal
      isOpen
      title={t("importTitle")}
      description={t("importDescription")}
      size="2xl"
      closeLabel={t("close")}
      onClose={() => {
        if (!saving) onClose();
      }}
      closeOnEscape={!saving}
      closeOnBackdropClick={!saving}
      footer={
        <>
          <button
            type="button"
            disabled={saving}
            onClick={onClose}
            className="rounded-xl border border-border px-4 py-2 text-sm font-bold disabled:opacity-50"
          >
            {t("cancel")}
          </button>
          <button
            type="submit"
            form="students-import"
            disabled={saving || !file || !catalog?.semester}
            className="rounded-xl bg-primary px-4 py-2 text-sm font-bold text-primary-foreground disabled:opacity-50"
          >
            {t(saving ? "importing" : "import")}
          </button>
        </>
      }
    >
      <form
        id="students-import"
        onSubmit={(event) => void submit(event)}
        className="space-y-5"
      >
        {error && (
          <p
            role="alert"
            className="rounded-xl bg-destructive/10 p-3 text-sm text-destructive"
          >
            {error}
            {!catalog && (
              <button
                type="button"
                onClick={() => {
                  setError(null);
                  setRetry((value) => value + 1);
                }}
                className="ml-3 underline"
              >
                {t("retry")}
              </button>
            )}
          </p>
        )}
        {!catalog ? (
          !error && <FormSkeleton label={t("loading")} />
        ) : (
          <>
            <p className="text-sm font-semibold text-primary">
              {catalog.semester
                ? t("semester", { name: catalog.semester.name })
                : t("noSemesterImport")}
            </p>
            <p className="text-sm text-muted-foreground">{t("csvFormat")}</p>
            <code className="block overflow-x-auto rounded-xl bg-muted/40 p-3 text-xs text-foreground">
              nombre;correo;nrc1;nrc2;…
            </code>
            <p className="text-xs text-muted-foreground">{t("importRules")}</p>
            <button
              type="button"
              onClick={download}
              disabled={saving}
              className="rounded-xl border border-primary/30 px-3 py-2 text-sm font-semibold text-primary hover:bg-primary/5"
            >
              {t("downloadExample")}
            </button>
            <label className="block text-sm font-semibold">
              {t("file")}
              <input
                type="file"
                accept=".csv,text/csv"
                disabled={saving || !catalog.semester}
                onChange={(event) => {
                  setFile(event.target.files?.[0] ?? null);
                  setError(null);
                }}
                className="mt-2 block w-full rounded-xl border border-border bg-background p-3 text-sm text-foreground file:mr-3 file:rounded-lg file:border-0 file:bg-primary/10 file:px-3 file:py-2 file:text-primary disabled:opacity-50"
              />
            </label>
          </>
        )}
      </form>
    </Modal>
  );
}
