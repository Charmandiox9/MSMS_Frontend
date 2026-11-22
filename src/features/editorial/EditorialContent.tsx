"use client";

import { useId, useRef, useState } from "react";
import { useFormatter, useLocale, useTranslations } from "next-intl";
import { Download, Play, ArrowRight } from "lucide-react";
import { toast } from "sonner";
import { Link } from "@/i18n/routing";
import { useActiveRole } from "@/context/ActiveRoleContext";
import { DASHBOARD_SECTIONS, isRouteAllowed } from "@/config/navigation";
import type {
  EditorialFileView,
  EditorialPublication,
  EditorialRevisionView,
} from "./schema-types";
import { editorialFileUrl } from "./files";
import {
  buttonClass,
  editorialDestinations,
  editorialText,
  linkClass,
  publicationHref,
} from "./presentation";

function emphasis(text: string) {
  return text.split(/(\*\*[^*\n]+\*\*|\*[^*\n]+\*)/).map((part, index) => {
    if (part.startsWith("**") && part.endsWith("**") && part.length > 4)
      return <strong key={index}>{part.slice(2, -2)}</strong>;
    if (part.startsWith("*") && part.endsWith("*") && part.length > 2)
      return <em key={index}>{part.slice(1, -1)}</em>;
    return part;
  });
}

export function EditorialBody({ body }: { body: string }) {
  if (!body) return null;
  return (
    <div className="space-y-4 leading-relaxed">
      {body.split(/\r?\n\s*\r?\n/).map((block, index) => {
        const lines = block.split(/\r?\n/);
        if (lines.every((line) => /^[-*] /.test(line)))
          return (
            <ul key={index} className="list-disc space-y-1 ps-6">
              {lines.map((line, order) => (
                <li key={order}>{emphasis(line.slice(2))}</li>
              ))}
            </ul>
          );
        if (lines.every((line) => /^\d+\. /.test(line)))
          return (
            <ol key={index} className="list-decimal space-y-1 ps-6">
              {lines.map((line, order) => (
                <li key={order}>{emphasis(line.replace(/^\d+\. /, ""))}</li>
              ))}
            </ol>
          );
        return (
          <p key={index} className="whitespace-pre-line break-words">
            {emphasis(block)}
          </p>
        );
      })}
    </div>
  );
}

export function EditorialDate({ date }: { date: string }) {
  const format = useFormatter();
  return (
    <time dateTime={date}>
      {format.dateTime(new Date(date), {
        dateStyle: "medium",
        timeZone: "America/Santiago",
      })}
    </time>
  );
}

function EditorialVideo({
  video,
  captions,
  preview,
}: {
  video: EditorialFileView;
  captions: EditorialFileView[];
  preview: boolean;
}) {
  const t = useTranslations("Editorial");
  const { activeRole } = useActiveRole();
  const [urls, setUrls] = useState<{ video: string; captions: string[] }>();
  const [failed, setFailed] = useState(false);
  const [busy, setBusy] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const resumeAt = useRef(0);
  const labelId = useId();

  async function load() {
    setBusy(true);
    setFailed(false);
    const access = Promise.all([
      editorialFileUrl(video.id, preview, activeRole),
      Promise.all(
        captions.map((track) =>
          editorialFileUrl(track.id, preview, activeRole),
        ),
      ),
    ]);
    toast.promise(access, {
      loading: t("media.loading"),
      success: t("media.ready"),
      error: t("media.error"),
    });
    try {
      const [videoUrl, captionsUrls] = await access;
      setUrls({ video: videoUrl, captions: captionsUrls });
    } catch {
      setFailed(true);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-3 rounded-xl border border-border bg-background p-4">
      <p id={labelId} className="break-all text-sm font-semibold">
        {video.fileName}{" "}
        <span className="font-normal text-muted-foreground">
          · {t(`language.${video.language}`)}
        </span>
      </p>
      {urls && !failed ? (
        <video
          key={urls.video}
          ref={videoRef}
          src={urls.video}
          width={1280}
          height={720}
          controls
          playsInline
          preload="metadata"
          crossOrigin="use-credentials"
          aria-labelledby={labelId}
          className="aspect-video w-full rounded-lg bg-black object-contain"
          onLoadedMetadata={(event) => {
            if (resumeAt.current > 0)
              event.currentTarget.currentTime = resumeAt.current;
          }}
          onError={() => {
            resumeAt.current = videoRef.current?.currentTime ?? 0;
            setFailed(true);
          }}
        >
          {captions.map((track, index) => (
            <track
              key={track.id}
              kind="captions"
              src={urls.captions[index]}
              srcLang={track.language.toLowerCase()}
              label={t(`language.${track.language}`)}
              default={
                index ===
                captions.findIndex((file) => file.language === video.language)
              }
            />
          ))}
        </video>
      ) : (
        <>
          {failed && (
            <p role="alert" className="text-sm text-muted-foreground">
              {t("media.error")}
            </p>
          )}
          <button
            type="button"
            disabled={busy}
            onClick={() => void load()}
            className={buttonClass}
          >
            <Play size={16} aria-hidden="true" />
            {t(busy ? "media.loading" : failed ? "retry" : "media.open")}
          </button>
        </>
      )}
    </div>
  );
}

function EditorialPdf({
  file,
  preview,
}: {
  file: EditorialFileView;
  preview: boolean;
}) {
  const { activeRole } = useActiveRole();
  const t = useTranslations("Editorial");
  const [busy, setBusy] = useState(false);
  async function download() {
    setBusy(true);
    const operation = editorialFileUrl(file.id, preview, activeRole).then(
      (url) => {
        const anchor = document.createElement("a");
        anchor.href = url;
        anchor.download = file.fileName;
        document.body.append(anchor);
        anchor.click();
        anchor.remove();
      },
    );
    toast.promise(operation, {
      loading: t("media.loading"),
      success: t("media.downloading"),
      error: t("media.error"),
    });
    try {
      await operation;
    } catch {
      /* Sonner reports the failure. */
    } finally {
      setBusy(false);
    }
  }
  return (
    <button
      type="button"
      disabled={busy}
      onClick={() => void download()}
      className={`${buttonClass} max-w-full text-start`}
    >
      <Download size={16} className="shrink-0" aria-hidden="true" />
      <span className="break-all">
        {t("media.pdf", {
          name: file.fileName,
          language: t(`language.${file.language}`),
        })}
      </span>
    </button>
  );
}

export function EditorialContent({
  publication,
  revision,
  preview = false,
  language,
}: {
  publication: EditorialPublication;
  revision: EditorialRevisionView;
  preview?: boolean;
  language?: string;
}) {
  const t = useTranslations("Editorial");
  const locale = useLocale();
  const { activeRole } = useActiveRole();
  const copy = editorialText(revision, language ?? locale);
  const destination = revision.destination
    ? editorialDestinations[revision.destination]
    : null;
  const canVisit =
    destination && isRouteAllowed(destination, DASHBOARD_SECTIONS, activeRole);
  const videos = revision.files.filter((file) => file.kind === "VIDEO");
  const manuals = revision.files.filter((file) => file.kind === "PDF");
  return (
    <article className="max-w-4xl space-y-6 rounded-2xl border border-border bg-card p-5 shadow-sm sm:p-8">
      <header className="space-y-3 border-b border-border pb-5">
        <p className="flex flex-wrap gap-x-3 gap-y-1 text-sm font-medium text-muted-foreground">
          {revision.topic && (
            <span className="text-primary">{t(`topic.${revision.topic}`)}</span>
          )}
          {!preview && publication.firstPublishedAt && (
            <EditorialDate date={publication.firstPublishedAt} />
          )}
          {!preview &&
            publication.publishedAt &&
            publication.publishedAt !== publication.firstPublishedAt && (
              <span>
                {t("updated")} <EditorialDate date={publication.publishedAt} />
              </span>
            )}
        </p>
        <h1
          lang={copy.lang}
          className="break-words text-2xl font-bold tracking-tight sm:text-4xl"
        >
          {copy.title || t("untitled")}
        </h1>
        {copy.summary && (
          <p
            lang={copy.lang}
            className="break-words text-base text-muted-foreground"
          >
            {copy.summary}
          </p>
        )}
        {(language ?? locale) !== copy.lang && (
          <p className="text-xs text-muted-foreground">
            {t("spanishFallback")}
          </p>
        )}
      </header>
      <div lang={copy.lang}>
        <EditorialBody body={copy.body} />
      </div>
      {(canVisit || revision.guideId) && (
        <div className="flex flex-wrap gap-4">
          {revision.guideId && (
            <Link
              href={publicationHref("GUIDE", revision.guideId)}
              className={linkClass}
            >
              {t("relatedGuide")}
            </Link>
          )}
          {canVisit && (
            <Link
              href={destination}
              className={`${linkClass} inline-flex items-center gap-1`}
            >
              {t(`destination.${revision.destination}`)}{" "}
              <ArrowRight size={15} aria-hidden="true" />
            </Link>
          )}
        </div>
      )}
      {(manuals.length > 0 || videos.length > 0) && (
        <section className="space-y-4 border-t border-border pt-5">
          <h2 className="text-lg font-semibold">{t("media.resources")}</h2>
          {manuals.map((file) => (
            <EditorialPdf key={file.id} file={file} preview={preview} />
          ))}
          {videos.map((video) => (
            <EditorialVideo
              key={video.id}
              video={video}
              captions={revision.files.filter(
                (file) => file.kind === "CAPTIONS" && file.videoId === video.id,
              )}
              preview={preview}
            />
          ))}
        </section>
      )}
    </article>
  );
}
