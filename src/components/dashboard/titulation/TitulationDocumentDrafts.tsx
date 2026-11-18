"use client";

import { Download, LoaderCircle } from "lucide-react";
import { useTranslations } from "next-intl";
import { useId, useState } from "react";
import { academicSecondaryActionClass } from "@/components/dashboard/academic/academicActionStyles";
import { apiFetchFile } from "@/lib/api";
import { downloadBlob } from "@/lib/download";
import type { TitulationDocumentDraftKind } from "./titulation-types";

const WORD_MIME =
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document";

interface TitulationDocumentDraftsProps {
  processId: string;
  reference: string;
  drafts: readonly TitulationDocumentDraftKind[];
}

export default function TitulationDocumentDrafts({
  processId,
  reference,
  drafts,
}: TitulationDocumentDraftsProps) {
  const t = useTranslations("TitulationPage.drafts");
  const headingId = useId();
  const [downloading, setDownloading] = useState<TitulationDocumentDraftKind | null>(null);
  const [downloadError, setDownloadError] = useState(false);

  if (drafts.length === 0) return null;

  async function download(kind: TitulationDocumentDraftKind) {
    setDownloadError(false);
    setDownloading(kind);
    try {
      const file = await apiFetchFile(
        `/academic/titulations/${encodeURIComponent(processId)}/documents/${kind}`,
        WORD_MIME,
      );
      const safeReference = reference
        .replace(/[^a-zA-Z0-9-]/g, "")
        .toUpperCase();
      downloadBlob(`${safeReference}-${kind}.docx`, file);
    } catch {
      setDownloadError(true);
    } finally {
      setDownloading(null);
    }
  }

  return (
    <section className="space-y-3" aria-labelledby={headingId}>
      <h3 id={headingId} className="text-sm font-semibold text-foreground">
        {t("title")}
      </h3>
      <p className="text-sm leading-relaxed text-muted-foreground">
        {t("description")}
      </p>
      <ul className="space-y-2">
        {drafts.map((kind) => (
          <li key={kind}>
            <button
              type="button"
              className={academicSecondaryActionClass}
              disabled={downloading !== null}
              aria-busy={downloading === kind}
              onClick={() => void download(kind)}
            >
              {downloading === kind ? (
                <LoaderCircle className="size-4 shrink-0 motion-safe:animate-spin" aria-hidden="true" />
              ) : (
                <Download className="size-4 shrink-0" aria-hidden="true" />
              )}
              {t(downloading === kind ? "downloading" : kind)}
            </button>
          </li>
        ))}
      </ul>
      {downloadError && <p role="alert" className="text-sm text-danger">{t("error")}</p>}
    </section>
  );
}
