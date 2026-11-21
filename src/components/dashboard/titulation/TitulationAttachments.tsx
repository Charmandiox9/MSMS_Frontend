"use client";

import { Download, LoaderCircle, Upload } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useEffect, useId, useRef, useState } from "react";
import type { FormEvent } from "react";
import { SkeletonStatus } from "@/components/ui/LoadingSkeletons";
import Skeleton from "@/components/ui/Skeleton";
import FileDropzone from "@/components/ui/FileDropzone";
import { academicPrimaryActionClass, academicSecondaryActionClass } from "@/components/dashboard/academic/academicActionStyles";
import { apiFetch, apiFetchFile } from "@/lib/api";
import { downloadBlob } from "@/lib/download";
import type {
  TitulationDocumentKind,
  TitulationDocumentStatus,
} from "./titulation-types";

const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024;
const PDF_MIME = "application/pdf";
const DOCX_MIME = "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
const ATTACHMENTS_MIME = "application/octet-stream";
const DOCUMENT_KIND_LABELS: Record<
  TitulationDocumentKind,
  "defenseAnnexes" | "thesisSummary" | "libraryForm" | "acta" | "evaluations"
> = {
  DEFENSE_ANNEXES: "defenseAnnexes",
  THESIS_SUMMARY: "thesisSummary",
  LIBRARY_FORM: "libraryForm",
  ACTA: "acta",
  EVALUATIONS: "evaluations",
};
const DOCUMENT_KINDS = [
  "DEFENSE_ANNEXES",
  "THESIS_SUMMARY",
  "LIBRARY_FORM",
  "ACTA",
  "EVALUATIONS",
] as const satisfies readonly TitulationDocumentKind[];
const DOCUMENT_STATUSES = [
  "UNVERIFIED",
  "PENDING",
  "RECEIVED",
  "PREPARED",
] as const satisfies readonly TitulationDocumentStatus[];

interface TitulationAttachment {
  id: string;
  documentKind: TitulationDocumentKind | null;
  originalName: string;
  contentType: string;
  size: number;
  createdAt: string;
}

function isTitulationDocumentKind(value: unknown): value is TitulationDocumentKind {
  return (
    typeof value === "string" &&
    Object.prototype.hasOwnProperty.call(DOCUMENT_KIND_LABELS, value)
  );
}

function isTitulationDocumentStatus(
  value: string,
): value is TitulationDocumentStatus {
  return DOCUMENT_STATUSES.some((status) => status === value);
}

function isTitulationAttachment(value: unknown): value is TitulationAttachment {
  if (typeof value !== "object" || value === null || Array.isArray(value))
    return false;
  const record = value as Record<string, unknown>;
  return (
    typeof record.id === "string" &&
    (record.documentKind === null ||
      isTitulationDocumentKind(record.documentKind)) &&
    typeof record.originalName === "string" &&
    (record.contentType === PDF_MIME || record.contentType === DOCX_MIME) &&
    typeof record.size === "number" &&
    Number.isSafeInteger(record.size) &&
    record.size >= 0 &&
    typeof record.createdAt === "string"
  );
}

function parseTitulationAttachments(value: unknown): TitulationAttachment[] {
  if (!Array.isArray(value) || !value.every(isTitulationAttachment))
    throw new Error("Invalid attachment response");
  return value;
}

function getSelectedFileError(file: File): "emptyFile" | "typeError" | "sizeError" | null {
  if (file.size === 0) return "emptyFile";
  if (file.size > MAX_FILE_SIZE_BYTES) return "sizeError";
  const extension = file.name.toLowerCase().split(".").pop();
  const isPdf = extension === "pdf" && file.type === PDF_MIME;
  const isDocx = extension === "docx" && file.type === DOCX_MIME;
  return isPdf || isDocx ? null : "typeError";
}

function formatFileSize(size: number, locale: string): string {
  return new Intl.NumberFormat(locale, {
    style: "unit",
    unit: "kilobyte",
    unitDisplay: "short",
    maximumFractionDigits: 0,
  }).format(Math.ceil(size / 1024));
}

function formatUploadDate(value: string, locale: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat(locale, { dateStyle: "medium" }).format(date);
}

export default function TitulationAttachments({
  processId,
  onUploadComplete,
}: {
  processId: string;
  onUploadComplete?: () => void;
}) {
  const t = useTranslations("TitulationPage.attachments");
  const tDocuments = useTranslations("TitulationPage.documents");
  const tDocumentStatus = useTranslations("TitulationPage.documentStatus");
  const locale = useLocale();
  const headingId = useId();
  const documentKindId = useId();
  const documentKindHelpId = useId();
  const documentStatusId = useId();
  const inputId = useId();
  const helpId = useId();
  const errorId = useId();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [attachments, setAttachments] = useState<TitulationAttachment[]>([]);
  const [documentKind, setDocumentKind] = useState<TitulationDocumentKind | "">("");
  const [documentStatus, setDocumentStatus] =
    useState<TitulationDocumentStatus>("RECEIVED");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectionError, setSelectionError] = useState<
    "emptyFile" | "typeError" | "sizeError" | null
  >(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState(false);
  const [uploadSuccessKind, setUploadSuccessKind] =
    useState<{
      documentKind: TitulationDocumentKind;
      documentStatus: TitulationDocumentStatus;
    } | null>(null);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [downloadError, setDownloadError] = useState(false);

  useEffect(() => {
    const controller = new AbortController();

    void apiFetch<unknown>(
      `/academic/titulations/${encodeURIComponent(processId)}/attachments`,
      { cache: "no-store", signal: controller.signal },
    )
      .then(parseTitulationAttachments)
      .then(setAttachments)
      .catch(() => {
        if (!controller.signal.aborted) setLoadError(true);
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });

    return () => controller.abort();
  }, [processId, reloadKey]);

  function selectFile(file: File | null) {
    setUploadError(false);
    setUploadSuccessKind(null);
    setSelectionError(file ? getSelectedFileError(file) : null);
    setSelectedFile(file);
  }

  async function upload(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedFile || !documentKind || selectionError || uploading) return;

    setUploadError(false);
    setUploadSuccessKind(null);
    setUploading(true);
    const formData = new FormData();
    formData.append("file", selectedFile, selectedFile.name);
    formData.append("documentKind", documentKind);
    formData.append("documentStatus", documentStatus);
    try {
      const attachment = await apiFetch<TitulationAttachment>(
        `/academic/titulations/${encodeURIComponent(processId)}/attachments`,
        { method: "POST", body: formData },
      );
      if (!isTitulationAttachment(attachment) || attachment.documentKind !== documentKind)
        throw new Error();
      setAttachments((current) => [attachment, ...current]);
      setSelectedFile(null);
      setSelectionError(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
      setUploadSuccessKind({ documentKind, documentStatus });
      onUploadComplete?.();
    } catch {
      setUploadError(true);
    } finally {
      setUploading(false);
    }
  }

  function retryLoading() {
    setLoading(true);
    setLoadError(false);
    setReloadKey((current) => current + 1);
  }

  async function download(attachment: TitulationAttachment) {
    setDownloadError(false);
    setDownloadingId(attachment.id);
    try {
      const file = await apiFetchFile(
        `/academic/titulations/${encodeURIComponent(processId)}/attachments/${encodeURIComponent(attachment.id)}/file`,
        ATTACHMENTS_MIME,
      );
      downloadBlob(attachment.originalName, file);
    } catch {
      setDownloadError(true);
    } finally {
      setDownloadingId(null);
    }
  }

  return (
    <section className="space-y-3" aria-labelledby={headingId}>
      <h3 id={headingId} className="text-sm font-semibold text-foreground">
        {t("title")}
      </h3>
      <form className="space-y-3" onSubmit={upload}>
        <div className="space-y-1.5">
          <label htmlFor={documentKindId} className="text-sm font-medium text-foreground">
            {t("documentKindLabel")}
          </label>
          <select
            id={documentKindId}
            value={documentKind}
            required
            disabled={uploading}
            aria-describedby={documentKindHelpId}
            onChange={(event) => {
              const value = event.currentTarget.value;
              setDocumentKind(
                isTitulationDocumentKind(value) ? value : "",
              );
              setUploadError(false);
              setUploadSuccessKind(null);
            }}
            className="min-h-11 w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus disabled:opacity-60"
          >
            <option value="">{t("documentKindPlaceholder")}</option>
            {DOCUMENT_KINDS.map((kind) => (
              <option key={kind} value={kind}>
                {tDocuments(DOCUMENT_KIND_LABELS[kind])}
              </option>
            ))}
          </select>
          <p id={documentKindHelpId} className="text-xs leading-relaxed text-muted-foreground">
            {t("documentKindHelp")}
          </p>
        </div>
        <div className="space-y-1.5">
          <label htmlFor={documentStatusId} className="text-sm font-medium text-foreground">
            {t("documentStatusLabel")}
          </label>
          <select
            id={documentStatusId}
            value={documentStatus}
            required
            disabled={uploading}
            aria-describedby={documentKindHelpId}
            onChange={(event) => {
              const value = event.currentTarget.value;
              if (isTitulationDocumentStatus(value)) {
                setDocumentStatus(value);
                setUploadError(false);
                setUploadSuccessKind(null);
              }
            }}
            className="min-h-11 w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus disabled:opacity-60"
          >
            {DOCUMENT_STATUSES.map((status) => (
              <option key={status} value={status}>
                {tDocumentStatus(status)}
              </option>
            ))}
          </select>
        </div>
        <FileDropzone disabled={uploading} onFileDrop={selectFile}>
          <div className="space-y-1.5">
            <label htmlFor={inputId} className="text-sm font-medium text-foreground">
              {t("fileLabel")}
            </label>
            <input
              ref={fileInputRef}
              id={inputId}
              type="file"
              accept={`.pdf,.docx,${PDF_MIME},${DOCX_MIME}`}
              disabled={uploading}
              aria-describedby={selectionError ? `${helpId} ${errorId}` : helpId}
              onChange={(event) => selectFile(event.currentTarget.files?.[0] ?? null)}
              className="block min-h-11 w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground file:mr-3 file:min-h-8 file:rounded-lg file:border-0 file:bg-primary/10 file:px-3 file:py-1 file:font-semibold file:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-60"
            />
            <p id={helpId} className="text-xs leading-relaxed text-muted-foreground">
              {t("description")}
            </p>
            {selectionError && (
              <p id={errorId} role="alert" className="text-sm text-danger">
                {t(selectionError)}
              </p>
            )}
            {selectedFile && !selectionError && (
              <p className="text-xs text-muted-foreground">
                {t("selected", {
                  name: selectedFile.name,
                  size: formatFileSize(selectedFile.size, locale),
                })}
              </p>
            )}
          </div>
        </FileDropzone>
        <button
          type="submit"
          className={academicPrimaryActionClass}
          disabled={!documentKind || !selectedFile || selectionError !== null || uploading}
          aria-busy={uploading}
        >
          {uploading ? (
            <LoaderCircle className="size-4 shrink-0 motion-safe:animate-spin" aria-hidden="true" />
          ) : (
            <Upload className="size-4 shrink-0" aria-hidden="true" />
          )}
          {t(uploading ? "uploading" : "upload")}
        </button>
      </form>
      {uploadError && <p role="alert" className="text-sm text-danger">{t("uploadError")}</p>}
      {uploadSuccessKind && (
        <p role="status" className="text-sm text-success">
          {t("uploadSuccess", {
            document: tDocuments(
              DOCUMENT_KIND_LABELS[uploadSuccessKind.documentKind],
            ),
            status: tDocumentStatus(uploadSuccessKind.documentStatus),
          })}
        </p>
      )}
      {downloadError && <p role="alert" className="text-sm text-danger">{t("downloadError")}</p>}
      {loading ? (
        <SkeletonStatus label={t("loading")}>
          <div className="space-y-2 rounded-xl border border-border bg-card p-3">
            <Skeleton className="h-4 w-2/3 max-w-full" />
            <Skeleton className="h-3 w-1/3 max-w-full" />
          </div>
        </SkeletonStatus>
      ) : loadError ? (
        <div className="space-y-2" role="alert">
          <p className="text-sm text-danger">{t("loadError")}</p>
          <button
            type="button"
            className={academicSecondaryActionClass}
            onClick={retryLoading}
          >
            {t("retry")}
          </button>
        </div>
      ) : attachments.length === 0 ? (
        <p className="text-sm text-muted-foreground">{t("empty")}</p>
      ) : (
        <ul className="divide-y divide-border rounded-xl border border-border">
          {attachments.map((attachment) => {
            const downloading = downloadingId === attachment.id;
            return (
              <li
                key={attachment.id}
                className="flex min-h-14 flex-col gap-3 px-3 py-3 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="min-w-0">
                  <p className="break-words text-sm font-medium text-foreground">
                    {attachment.originalName}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {attachment.documentKind
                      ? tDocuments(DOCUMENT_KIND_LABELS[attachment.documentKind])
                      : t("unclassified")}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {t("details", {
                      size: formatFileSize(attachment.size, locale),
                      date: formatUploadDate(attachment.createdAt, locale),
                    })}
                  </p>
                </div>
                <button
                  type="button"
                  className={academicSecondaryActionClass}
                  disabled={downloadingId !== null}
                  aria-busy={downloading}
                  onClick={() => void download(attachment)}
                >
                  {downloading ? (
                    <LoaderCircle className="size-4 shrink-0 motion-safe:animate-spin" aria-hidden="true" />
                  ) : (
                    <Download className="size-4 shrink-0" aria-hidden="true" />
                  )}
                  {t(downloading ? "downloading" : "download")}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
