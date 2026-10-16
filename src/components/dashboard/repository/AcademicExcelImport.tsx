"use client";

import { useEffect, useState } from "react";
import { FileSpreadsheet } from "lucide-react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { apiFetch } from "@/lib/api";
import Modal from "@/components/ui/Modal";
import { primaryButton, secondaryButton } from "./repository-fields";

type Preview = {
  totalRows: number;
  importable: number;
  estimatedTotalClp?: string;
  errors: { row: number; message: string }[];
  duplicates: { row: number; message: string }[];
  warnings: { row: number; message: string }[];
  unmatchedTeachers?: { rut: string; name: string; rows: number[] }[];
  sample: {
    row: number;
    title: string;
    code?: string | null;
    reportingYear: number;
    academicUnit?: string;
  }[];
};

type ImportKind = "projects" | "research" | "hourly";
type TeacherEmail = { rut: string; email: string };
type ImportJob = {
  id: string;
  status: "QUEUED" | "PROCESSING" | "COMPLETED" | "FAILED";
  result?: { imported: number } | null;
  error?: string | null;
};

const readBase64 = (file: File) =>
  new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Could not read file"));
    reader.onload = () => {
      const result = reader.result;
      if (typeof result !== "string")
        return reject(new Error("Could not read file"));
      resolve(result.slice(result.indexOf(",") + 1));
    };
    reader.readAsDataURL(file);
  });

export default function AcademicExcelImport({
  kind = "projects",
  onImported,
}: {
  kind?: ImportKind;
  onImported: () => void;
}) {
  const t = useTranslations("AcademicRepository.import");
  const isProjects = kind === "projects";
  const isResearch = kind === "research";
  const endpoint = `/academic/imports/${kind}`;
  const [open, setOpen] = useState(false);
  const [fileBase64, setFileBase64] = useState<string | null>(null);
  const [preview, setPreview] = useState<Preview | null>(null);
  const [teacherEmails, setTeacherEmails] = useState<Record<string, string>>(
    {},
  );
  const [emailsDirty, setEmailsDirty] = useState(false);
  const [busy, setBusy] = useState(false);
  const [job, setJob] = useState<ImportJob | null>(null);
  const [error, setError] = useState<string | null>(null);
  const teacherEmailPayload = (): TeacherEmail[] =>
    Object.entries(teacherEmails)
      .map(([rut, email]) => ({ rut, email: email.trim().toLowerCase() }))
      .filter(({ email }) => email.length > 0);
  const hasMissingEmail = (preview?.unmatchedTeachers?.length ?? 0) > 0;
  const jobInProgress = job?.status === "QUEUED" || job?.status === "PROCESSING";
  const canConfirm =
    Boolean(preview?.importable) &&
    Boolean(fileBase64) &&
    !busy &&
    !jobInProgress &&
    !emailsDirty &&
    !hasMissingEmail;

  useEffect(() => {
    if (!job || job.status === "COMPLETED" || job.status === "FAILED") return;
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout>;
    const poll = async () => {
      try {
        const status = await apiFetch<ImportJob>(
          `/academic/imports/jobs/${job.id}`,
        );
        if (cancelled) return;
        setJob(status);
        if (status.status === "COMPLETED") {
          const count = status.result?.imported ?? 0;
          toast.success(
            isProjects
              ? t("imported", { count })
              : isResearch
                ? t("researchImported", { count })
                : t("hourlyImported", { count }),
          );
          onImported();
          setFileBase64(null);
          setPreview(null);
          setJob(null);
          setOpen(false);
        } else if (status.status === "FAILED") {
          toast.error(status.error || t("importError"));
        } else {
          timer = setTimeout(() => void poll(), 1_500);
        }
      } catch {
        if (!cancelled) timer = setTimeout(() => void poll(), 3_000);
      }
    };
    timer = setTimeout(() => void poll(), 500);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [job?.id, job?.status, isProjects, isResearch, onImported, t]);

  const requestPreview = async (
    encoded: string,
    emails: TeacherEmail[] = [],
  ) => {
    const result = await apiFetch<Preview>(`${endpoint}/preview`, {
      method: "POST",
      body: JSON.stringify({
        fileBase64: encoded,
        ...(emails.length ? { teacherEmails: emails } : {}),
      }),
    });
    setPreview(result);
    setEmailsDirty(false);
  };

  const chooseFile = async (file?: File) => {
    if (!file) return;
    if (!file.name.toLocaleLowerCase().endsWith(".xlsx")) {
      setError(t("xlsxOnly"));
      return;
    }
    if (file.size > 12 * 1024 * 1024) {
      setError(t("tooLarge"));
      return;
    }
    setBusy(true);
    setError(null);
    setPreview(null);
    setJob(null);
    setTeacherEmails({});
    setFileBase64(null);
    try {
      const encoded = await readBase64(file);
      setFileBase64(encoded);
      await requestPreview(encoded);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : t("previewError"));
    } finally {
      setBusy(false);
    }
  };

  const reviewTeacherEmails = async () => {
    if (!fileBase64 || !preview?.unmatchedTeachers?.length || busy) return;
    const emails = preview.unmatchedTeachers.map(({ rut }) => ({
      rut,
      email: teacherEmails[rut]?.trim().toLowerCase() ?? "",
    }));
    if (emails.some(({ email }) => !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))) {
      setError(t("teacherEmailRequired"));
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await requestPreview(fileBase64, emails);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : t("previewError"));
    } finally {
      setBusy(false);
    }
  };

  const importFile = async () => {
    if (!fileBase64 || !canConfirm || !preview) return;
    setBusy(true);
    const emails = teacherEmailPayload();
    setJob(null);
    const operation = apiFetch<Pick<ImportJob, "id" | "status">>(
      `${endpoint}/commit`,
      {
      method: "POST",
      body: JSON.stringify({
        fileBase64,
        ...(emails.length ? { teacherEmails: emails } : {}),
      }),
      },
    );
    toast.promise(operation, {
      loading: t("queueSubmitting"),
      success: () => t("queued"),
      error: (cause: unknown) =>
        cause instanceof Error ? cause.message : t("importError"),
    });
    try {
      const queuedJob = await operation;
      setJob(queuedJob as ImportJob);
      setTeacherEmails({});
    } catch {
      // Keep the preview visible so the user can correct the source file.
    } finally {
      setBusy(false);
    }
  };

  const buttonLabel = isProjects
    ? t("button")
    : isResearch
      ? t("researchButton")
      : t("hourlyButton");
  const modalTitle = isProjects
    ? t("title")
    : isResearch
      ? t("researchTitle")
      : t("hourlyTitle");
  const description = isProjects
    ? t("description")
    : isResearch
      ? t("researchDescription")
      : t("hourlyDescription");
  const confirmLabel = isProjects
    ? t("confirm", { count: preview?.importable ?? 0 })
    : isResearch
      ? t("researchConfirm", { count: preview?.importable ?? 0 })
      : t("hourlyConfirm", { count: preview?.importable ?? 0 });

  return (
    <>
      <button
        type="button"
        className={secondaryButton}
        onClick={() => setOpen(true)}
      >
        <FileSpreadsheet className="h-4 w-4" />
        {buttonLabel}
      </button>
      {open && (
        <Modal
          isOpen
          title={modalTitle}
          description={description}
          size="lg"
          onClose={() => !busy && setOpen(false)}
          closeOnEscape={!busy}
          closeOnBackdropClick={!busy}
          closeLabel={t("close")}
        >
          <div className="space-y-4">
            <label className="block text-sm font-medium">
              {t("fileLabel")}
              <input
                type="file"
                accept=".xlsx"
                disabled={busy}
                className="mt-2 block w-full rounded-xl border border-border bg-background p-3 text-sm"
                onChange={(event) => void chooseFile(event.target.files?.[0])}
              />
            </label>
            {busy && (
              <p role="status" className="text-sm text-muted-foreground">
                {t("loading")}
              </p>
            )}
            {error && (
              <p
                role="alert"
                className="text-sm text-red-600 dark:text-red-400"
              >
                {error}
              </p>
            )}
            {job && (
              <p
                role="status"
                className="rounded-xl border border-border bg-muted/40 p-3 text-sm"
              >
                {job.status === "QUEUED"
                  ? t("jobQueued")
                  : job.status === "PROCESSING"
                    ? t("jobProcessing")
                    : job.status === "FAILED"
                      ? job.error || t("importError")
                      : t("jobCompleted")}
              </p>
            )}
            {preview && (
              <div className="space-y-3 rounded-xl border border-border p-4">
                <p className="text-sm font-semibold">
                  {t("counts", {
                    importable: preview.importable,
                    total: preview.totalRows,
                  })}
                </p>
                {preview.estimatedTotalClp && (
                  <p className="text-sm font-semibold">
                    {t("estimatedTotal", {
                      amount: new Intl.NumberFormat("es-CL", {
                        style: "currency",
                        currency: "CLP",
                        maximumFractionDigits: 0,
                      }).format(Number(preview.estimatedTotalClp)),
                    })}
                  </p>
                )}
                {preview.sample.length > 0 && (
                  <ul className="max-h-40 list-disc space-y-1 overflow-auto pl-5 text-sm">
                    {preview.sample.map((row) => (
                      <li key={row.row}>
                        {t("sampleRow", {
                          row: row.row,
                          title: row.title,
                          year: row.reportingYear,
                        })}
                      </li>
                    ))}
                  </ul>
                )}
                {kind === "hourly" &&
                  preview.unmatchedTeachers?.map(({ rut, name, rows }) => (
                    <label
                      key={rut}
                      className="grid gap-2 border-t border-border pt-3 text-sm sm:grid-cols-2 sm:items-center"
                    >
                      <span>
                        {t("teacherEmailPrompt", {
                          name,
                          rut,
                          rows: rows.join(", "),
                        })}
                      </span>
                      <input
                        type="email"
                        autoComplete="email"
                        required
                        maxLength={254}
                        value={teacherEmails[rut] ?? ""}
                        onChange={(event) => {
                          setTeacherEmails((current) => ({
                            ...current,
                            [rut]: event.target.value,
                          }));
                          setEmailsDirty(true);
                        }}
                        placeholder={t("teacherEmailPlaceholder")}
                        className="w-full rounded-xl border border-border bg-background px-3 py-2"
                      />
                    </label>
                  ))}
                {kind === "hourly" && hasMissingEmail && (
                  <button
                    type="button"
                    className={secondaryButton}
                    disabled={busy}
                    onClick={() => void reviewTeacherEmails()}
                  >
                    {t("reviewTeacherEmails")}
                  </button>
                )}
                {[...preview.errors, ...preview.duplicates]
                  .slice(0, 30)
                  .map((item) => (
                    <p
                      key={`${item.row}-${item.message}`}
                      className="text-xs text-red-600 dark:text-red-400"
                    >
                      {t("rowIssue", { row: item.row, message: item.message })}
                    </p>
                  ))}
                {preview.warnings.slice(0, 15).map((item) => (
                  <p
                    key={`${item.row}-${item.message}`}
                    className="text-xs text-amber-700 dark:text-amber-300"
                  >
                    {t("rowWarning", { row: item.row, message: item.message })}
                  </p>
                ))}
              </div>
            )}
            <div className="flex justify-end gap-3">
              <button
                type="button"
                className={secondaryButton}
                disabled={busy}
                onClick={() => setOpen(false)}
              >
                {t("cancel")}
              </button>
              <button
                type="button"
                className={primaryButton}
                disabled={!canConfirm}
                onClick={() => void importFile()}
              >
                {confirmLabel}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </>
  );
}
