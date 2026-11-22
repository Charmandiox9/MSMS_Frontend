"use client";

import { useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import {
  reserveEditorialFile,
  transferEditorialFile,
  type Reservation,
} from "@/features/editorial/files";
import {
  buttonClass,
  fieldClass,
  fileTypes,
} from "@/features/editorial/presentation";
import type {
  EditorialFileKind,
  EditorialFileView,
  EditorialLanguage,
} from "@/features/editorial/schema-types";

const kinds: EditorialFileKind[] = ["PDF", "VIDEO", "CAPTIONS"];

export default function DraftFiles({
  entryId,
  role,
  files,
  onChange,
  busy,
  onBusy,
}: {
  entryId: string;
  role: string;
  files: EditorialFileView[];
  onChange: (files: EditorialFileView[]) => void;
  busy: boolean;
  onBusy: (busy: boolean) => void;
}) {
  const t = useTranslations("Editorial");
  const [kind, setKind] = useState<EditorialFileKind>("PDF");
  const [language, setLanguage] = useState<EditorialLanguage>("ES");
  const [videoId, setVideoId] = useState("");
  const [upload, setUpload] = useState<File>();
  const [reservation, setReservation] = useState<Reservation>();
  const [replacing, setReplacing] = useState<EditorialFileView>();
  const [progress, setProgress] = useState<number>();
  const [failed, setFailed] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);
  const videos = files.filter((file) => file.kind === "VIDEO");
  const selectedVideo = videos.find((video) => video.id === videoId);

  function resetFile() {
    setReservation(undefined);
    setUpload(undefined);
    setProgress(undefined);
    setFailed(false);
    if (fileInput.current) fileInput.current.value = "";
  }

  function remove(file: EditorialFileView) {
    onChange(
      files.filter((item) => item.id !== file.id && item.videoId !== file.id),
    );
    if (replacing?.id === file.id || selectedVideo?.id === file.id) {
      setReplacing(undefined);
      resetFile();
    }
  }

  async function send() {
    if (!upload || (kind === "CAPTIONS" && !selectedVideo)) return;
    if (!upload.size || upload.size > fileTypes[kind].maxBytes) {
      toast.error(t("admin.uploadTooLarge"));
      return;
    }
    onBusy(true);
    setFailed(false);
    setProgress(0);
    const operation = (async () => {
      const reserved =
        reservation ??
        (await reserveEditorialFile(
          {
            entryId,
            kind,
            language,
            fileName: upload.name,
            videoId: kind === "CAPTIONS" ? selectedVideo?.id : undefined,
          },
          role,
        ));
      setReservation(reserved);
      return transferEditorialFile(reserved, upload, role, setProgress);
    })();
    toast.promise(operation, {
      loading: t("admin.uploading"),
      success: t("admin.uploaded"),
      error: t("admin.uploadError"),
    });
    try {
      const updated = await operation;
      const keep = replacing
        ? files.filter(
            (file) => file.id !== replacing.id && file.videoId !== replacing.id,
          )
        : files;
      onChange([...keep, updated]);
      setReplacing(undefined);
      resetFile();
    } catch {
      setFailed(true);
    } finally {
      onBusy(false);
    }
  }

  return (
    <section className="space-y-4 border-t border-border pt-5">
      <h2 className="text-lg font-semibold">{t("media.resources")}</h2>
      {files.length > 0 && (
        <ul className="divide-y divide-border rounded-xl border border-border">
          {files.map((file) => (
            <li
              key={file.id}
              className="flex flex-wrap items-center justify-between gap-2 p-3"
            >
              <p className="min-w-0 break-all text-sm">
                <strong>{file.fileName}</strong> · {t(`file.${file.kind}`)} ·{" "}
                {t(`language.${file.language}`)}
              </p>
              <div className="flex gap-2">
                <button
                  type="button"
                  className={buttonClass}
                  disabled={busy}
                  aria-label={t("admin.replaceNamed", { name: file.fileName })}
                  onClick={() => {
                    resetFile();
                    setReplacing(file);
                    setKind(file.kind);
                    setLanguage(file.language);
                    setVideoId(file.videoId ?? "");
                    fileInput.current?.focus();
                  }}
                >
                  {t("admin.replace")}
                </button>
                <button
                  type="button"
                  className={buttonClass}
                  disabled={busy}
                  aria-label={t("admin.removeNamed", { name: file.fileName })}
                  onClick={() => remove(file)}
                >
                  {t("admin.remove")}
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
      {replacing && (
        <p className="text-sm">
          {t("admin.replacing", { name: replacing.fileName })}{" "}
          {replacing.kind === "VIDEO" && t("admin.replaceVideoHint")}{" "}
          <button
            type="button"
            className={buttonClass}
            disabled={busy}
            onClick={() => {
              setReplacing(undefined);
              resetFile();
            }}
          >
            {t("admin.cancel")}
          </button>
        </p>
      )}
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="space-y-1 text-sm font-medium">
          <span>{t("admin.fileKind")}</span>
          <select
            className={fieldClass}
            value={kind}
            disabled={busy || !!replacing}
            onChange={(event) => {
              setKind(
                kinds.find((option) => option === event.target.value) ?? "PDF",
              );
              resetFile();
            }}
          >
            {kinds.map((option) => (
              <option key={option} value={option}>
                {t(`file.${option}`)}
              </option>
            ))}
          </select>
        </label>
        <label className="space-y-1 text-sm font-medium">
          <span>{t("admin.fileLanguage")}</span>
          <select
            disabled={busy}
            value={language}
            className={fieldClass}
            onChange={(event) => {
              setLanguage(event.target.value === "EN" ? "EN" : "ES");
              setReservation(undefined);
            }}
          >
            <option value="ES">{t("language.ES")}</option>
            <option value="EN">{t("language.EN")}</option>
          </select>
        </label>
        {kind === "CAPTIONS" && (
          <label className="space-y-1 text-sm font-medium sm:col-span-2">
            <span>{t("admin.captionVideo")}</span>
            <select
              value={selectedVideo?.id ?? ""}
              disabled={busy}
              className={fieldClass}
              onChange={(event) => {
                setVideoId(event.target.value);
                setReservation(undefined);
              }}
            >
              <option value="">{t("admin.selectVideo")}</option>
              {videos.map((video) => (
                <option key={video.id} value={video.id}>
                  {video.fileName}
                </option>
              ))}
            </select>
          </label>
        )}
        <label className="space-y-1 text-sm font-medium sm:col-span-2">
          <span>{t("admin.chooseFile")}</span>
          <input
            ref={fileInput}
            type="file"
            className={fieldClass}
            disabled={busy}
            accept={fileTypes[kind].accept}
            onChange={(event) => {
              setUpload(event.target.files?.[0]);
              setReservation(undefined);
              setFailed(false);
            }}
          />
          <span className="block text-xs font-normal text-muted-foreground">
            {t(`limit.${kind}`)}
          </span>
        </label>
      </div>
      {progress !== undefined && !failed && (
        <progress
          className="w-full accent-primary"
          value={progress}
          max={100}
          aria-label={t("admin.uploading")}
        />
      )}
      <button
        type="button"
        className={buttonClass}
        disabled={
          busy ||
          !upload ||
          (kind === "CAPTIONS" && !selectedVideo) ||
          (!replacing && files.length >= 24)
        }
        onClick={() => void send()}
      >
        {t(failed ? "retry" : "admin.upload")}
      </button>
      {files.length >= 24 && !replacing && (
        <p className="text-xs text-muted-foreground">{t("admin.fileLimit")}</p>
      )}
    </section>
  );
}
