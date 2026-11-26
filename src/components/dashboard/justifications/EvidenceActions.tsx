"use client";

import { useState } from "react";
import { Download, ExternalLink, Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { apiFetch } from "@/lib/api";

type Mode = "preview" | "download";

export default function EvidenceActions({
  id,
  contentType,
}: {
  id: string;
  contentType: string;
}) {
  const t = useTranslations("JustificationsPage");
  const [pending, setPending] = useState<Mode>();
  const canPreview = ["application/pdf", "image/jpeg", "image/png"].includes(
    contentType,
  );

  async function accessEvidence(mode: Mode) {
    const preview = mode === "preview";
    const tab = preview ? window.open("about:blank", "_blank") : null;
    if (preview && !tab) {
      toast.error(t("errors.evidencePopup"));
      return;
    }
    if (tab) tab.opener = null;
    setPending(mode);
    try {
      const { downloadUrl } = await apiFetch<{ downloadUrl: string }>(
        `/justifications/${encodeURIComponent(id)}/evidence-url${preview ? "?mode=preview" : ""}`,
        { cache: "no-store" },
      );
      if (typeof downloadUrl !== "string" || !downloadUrl.trim()) {
        throw new Error("Missing evidence URL");
      }
      const url = new URL(downloadUrl, window.location.href);
      if (!["https:", "http:"].includes(url.protocol)) {
        throw new Error("Invalid evidence URL");
      }
      if (tab) {
        if (tab.closed) return;
        tab.location.replace(url.href);
      } else {
        const link = document.createElement("a");
        link.href = url.href;
        link.rel = "noreferrer";
        link.download = "";
        link.click();
      }
      toast.success(t(preview ? "detail.previewOpened" : "detail.downloadStarted"));
    } catch {
      tab?.close();
      toast.error(t(preview ? "errors.evidence" : "errors.evidenceDownload"));
    } finally {
      setPending(undefined);
    }
  }

  return (
    <div className="flex flex-wrap gap-2">
      {canPreview && (
        <button
          type="button"
          disabled={Boolean(pending)}
          aria-busy={pending === "preview"}
          onClick={() => void accessEvidence("preview")}
          className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-primary/30 bg-primary/10 px-3 py-2 text-sm font-semibold text-primary transition hover:bg-primary/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:opacity-60"
        >
          {pending === "preview" ? (
            <Loader2 aria-hidden="true" className="size-4 animate-spin" />
          ) : (
            <ExternalLink aria-hidden="true" className="size-4" />
          )}
          {t("detail.previewEvidence")}
          <span className="sr-only">{t("detail.opensNewTab")}</span>
        </button>
      )}
      <button
        type="button"
        disabled={Boolean(pending)}
        aria-busy={pending === "download"}
        onClick={() => void accessEvidence("download")}
        className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-border bg-background px-3 py-2 text-sm font-semibold text-foreground transition hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:opacity-60"
      >
        {pending === "download" ? (
          <Loader2 aria-hidden="true" className="size-4 animate-spin" />
        ) : (
          <Download aria-hidden="true" className="size-4" />
        )}
        {t("detail.downloadEvidence")}
      </button>
    </div>
  );
}
