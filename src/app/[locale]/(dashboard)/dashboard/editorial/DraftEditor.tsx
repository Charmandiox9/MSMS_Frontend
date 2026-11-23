"use client";

import { useDeferredValue, useState } from "react";
import type { ApolloClient } from "@apollo/client";
import { useQuery } from "@apollo/client/react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { EditorialContent } from "@/features/editorial/EditorialContent";
import {
  ARCHIVE,
  EDITORIAL_ROLES,
  ENTRY,
  HIGHLIGHT,
  MANAGED,
  PUBLISH,
  SAVE,
} from "@/features/editorial/graphql";
import {
  buttonClass,
  editorialDestinations,
  editorialTopics,
  fieldClass,
  matchesEditorialAudience,
  primaryClass,
  roleHeaders,
} from "@/features/editorial/presentation";
import type {
  EditorialManagedEntry,
  EditorialRevisionView,
} from "@/features/editorial/schema-types";
import DraftFiles from "./DraftFiles";
import AudienceFields from "./AudienceFields";

const blank: EditorialRevisionView = {
  number: 1,
  topic: null,
  titleEs: "",
  summaryEs: "",
  bodyEs: "",
  titleEn: null,
  summaryEn: null,
  bodyEn: null,
  destination: null,
  guideId: null,
  files: [],
  roleCodes: [],
};
const destinations = Object.keys(editorialDestinations) as Array<
  keyof typeof editorialDestinations
>;
type Action = "save" | "publish" | "archive" | "highlight" | "reload";

export default function DraftEditor({
  initial,
  client,
  role,
  reload,
}: {
  initial: EditorialManagedEntry;
  client: ApolloClient;
  role: string;
  reload: () => Promise<EditorialManagedEntry | undefined>;
}) {
  const t = useTranslations("Editorial");
  const nav = useTranslations("DashboardNav");
  const [entry, setEntry] = useState(initial);
  const [revision, setRevision] = useState(
    initial.draft ?? initial.published ?? blank,
  );
  const [dirty, setDirty] = useState(false);
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState(false);
  const [previewLanguage, setPreviewLanguage] = useState<"es" | "en">("es");
  const [previewRole, setPreviewRole] = useState(role);
  const [restricted, setRestricted] = useState(
    () => !!(initial.draft ?? initial.published)?.roleCodes.length,
  );
  const [confirmArchive, setConfirmArchive] = useState(false);
  const [guideSearch, setGuideSearch] = useState("");
  const search = useDeferredValue(guideSearch.trim());
  const context = { headers: roleHeaders(role) };
  const roles = useQuery(EDITORIAL_ROLES, {
    client,
    context,
    fetchPolicy: "no-cache",
  });
  const roleOptions = (roles.data?.editorialRoleOptions ?? []).map(
    (option) => ({
      ...option,
      name: nav.has(`roles.${option.code}`)
        ? nav(`roles.${option.code}`)
        : option.name,
    }),
  );
  const guideQuery = useQuery(MANAGED, {
    client,
    context,
    fetchPolicy: "no-cache",
    skip: entry.kind !== "NEWS" || preview,
    variables: {
      filters: {
        kind: "GUIDE",
        publishedOnly: true,
        search: search || undefined,
        pageSize: 30,
      },
    },
  });
  const guides = guideQuery.data?.editorialManagedEntries.items ?? [];
  const previewGuide = useQuery(ENTRY, {
    client,
    context,
    fetchPolicy: "no-cache",
    skip: !preview || !revision.guideId,
    variables: { id: revision.guideId ?? "" },
  }).data?.editorialManagedEntry;
  const visibleGuide =
    previewGuide?.status === "PUBLISHED" &&
    previewGuide.published &&
    matchesEditorialAudience(previewGuide.published.roleCodes, previewRole);
  const visiblePreview =
    (!restricted || revision.roleCodes.length > 0) &&
    matchesEditorialAudience(revision.roleCodes, previewRole);
  const disabled = busy || uploading;

  function update(changes: Partial<EditorialRevisionView>) {
    setRevision((current) => ({ ...current, ...changes }));
    setDirty(true);
  }

  async function perform(action: Action) {
    if (action === "save" && restricted && !revision.roleCodes.length) {
      toast.error(t("audience.choose"));
      return;
    }
    setBusy(true);
    const input = { id: entry.id, version: entry.version };
    const operation = (async () => {
      if (action === "reload") return reload();
      if (action === "publish")
        return (
          await client.mutate({
            mutation: PUBLISH,
            variables: { input },
            context,
          })
        ).data?.publishEditorialEntry;
      if (action === "archive")
        return (
          await client.mutate({
            mutation: ARCHIVE,
            variables: { input },
            context,
          })
        ).data?.archiveEditorialEntry;
      if (action === "highlight")
        return (
          await client.mutate({
            mutation: HIGHLIGHT,
            variables: { input, featured: !entry.featured },
            context,
          })
        ).data?.setEditorialFeatured;
      const {
        topic,
        titleEs,
        summaryEs,
        bodyEs,
        titleEn,
        summaryEn,
        bodyEn,
        destination,
        guideId,
        files,
        roleCodes,
      } = revision;
      const draft = {
        ...input,
        topic,
        titleEs,
        summaryEs,
        bodyEs,
        titleEn,
        summaryEn,
        bodyEn,
        destination,
        guideId,
        roleCodes,
        fileIds: files.map((file) => file.id),
      };
      return (
        await client.mutate({
          mutation: SAVE,
          variables: { input: draft },
          context,
        })
      ).data?.saveEditorialDraft;
    })().then((result) => {
      if (!result) throw new Error("EDITORIAL_RESULT_MISSING");
      return result;
    });
    toast.promise(operation, {
      loading: t("admin.working"),
      success: t(`admin.result.${action}`),
      error: t("admin.actionError"),
    });
    try {
      const next = await operation;
      setEntry(next);
      setRevision(next.draft ?? next.published ?? blank);
      setRestricted(!!(next.draft ?? next.published)?.roleCodes.length);
      setDirty(false);
      setConfirmArchive(false);
    } catch {
      /* Sonner reports the failure and the draft remains editable. */
    } finally {
      setBusy(false);
    }
  }

  const textFields = [
    { key: "title", es: "titleEs", en: "titleEn", max: 180 },
    { key: "summary", es: "summaryEs", en: "summaryEn", max: 500 },
    { key: "body", es: "bodyEs", en: "bodyEn", max: 12000 },
  ] as const;

  return (
    <div className="space-y-5">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">
            {t(
              preview
                ? "admin.preview"
                : entry.kind === "NEWS"
                  ? "admin.editNews"
                  : "admin.editGuide",
            )}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {t(`status.${entry.status}`)}
            {dirty && ` · ${t("admin.unsaved")}`}
            {entry.draft &&
              entry.status === "PUBLISHED" &&
              ` · ${t("admin.pendingRevision")}`}
          </p>
        </div>
        <button
          type="button"
          className={buttonClass}
          disabled={disabled}
          aria-pressed={preview}
          onClick={() => setPreview(!preview)}
        >
          {t(preview ? "admin.returnToEdit" : "admin.preview")}
        </button>
      </header>
      {preview ? (
        <>
          <div className="grid max-w-xl gap-3 sm:grid-cols-2">
            <label className="block space-y-1 text-sm font-medium">
              <span>{t("admin.previewLanguage")}</span>
              <select
                className={fieldClass}
                value={previewLanguage}
                onChange={(event) =>
                  setPreviewLanguage(event.target.value === "en" ? "en" : "es")
                }
              >
                <option value="es">{t("language.ES")}</option>
                <option value="en">{t("language.EN")}</option>
              </select>
            </label>
            <label className="block space-y-1 text-sm font-medium">
              <span>{t("audience.previewAs")}</span>
              <select
                className={fieldClass}
                value={previewRole}
                onChange={(event) => setPreviewRole(event.target.value)}
              >
                {previewRole &&
                  !roleOptions.some(({ code }) => code === previewRole) && (
                    <option value={previewRole}>
                      {t("audience.activeRole")}
                    </option>
                  )}
                <option value="">{t("audience.noRole")}</option>
                {roleOptions.map(({ code, name }) => (
                  <option key={code} value={code}>
                    {name}
                  </option>
                ))}
              </select>
            </label>
          </div>
          {roles.error && (
            <p role="alert" className="text-sm text-muted-foreground">
              {t("audience.loadError")}
            </p>
          )}
          {visiblePreview ? (
            <EditorialContent
              key={previewRole}
              publication={entry}
              revision={{
                ...revision,
                guideId: visibleGuide ? revision.guideId : null,
              }}
              preview
              previewRole={previewRole || null}
              language={previewLanguage}
            />
          ) : (
            <p
              role="status"
              className="rounded-xl border border-border bg-card p-5"
            >
              {t("audience.hiddenPreview")}
            </p>
          )}
        </>
      ) : (
        <div className="max-w-5xl space-y-5 rounded-2xl border border-border bg-card p-4 sm:p-6">
          <AudienceFields
            roles={roleOptions}
            selected={revision.roleCodes}
            restricted={restricted}
            disabled={disabled}
            loading={roles.loading}
            failed={!!roles.error}
            onSelect={(roleCodes) => update({ roleCodes })}
            onMode={(next) => {
              setRestricted(next);
              update({ roleCodes: [] });
            }}
          />
          <fieldset
            disabled={disabled}
            className="grid min-w-0 gap-3 sm:grid-cols-2"
          >
            <label className="space-y-1 text-sm font-medium">
              <span>{t("module")}</span>
              <select
                className={fieldClass}
                value={revision.topic ?? ""}
                onChange={(event) =>
                  update({
                    topic:
                      editorialTopics.find(
                        (item) => item === event.target.value,
                      ) ?? null,
                  })
                }
              >
                <option value="">{t("admin.selectModule")}</option>
                {editorialTopics.map((item) => (
                  <option key={item} value={item}>
                    {t(`topic.${item}`)}
                  </option>
                ))}
              </select>
            </label>
            <label className="space-y-1 text-sm font-medium">
              <span>{t("admin.destination")}</span>
              <select
                className={fieldClass}
                value={revision.destination ?? ""}
                onChange={(event) =>
                  update({
                    destination:
                      destinations.find(
                        (item) => item === event.target.value,
                      ) ?? null,
                  })
                }
              >
                <option value="">{t("admin.none")}</option>
                {destinations.map((item) => (
                  <option key={item} value={item}>
                    {t(`destination.${item}`)}
                  </option>
                ))}
              </select>
            </label>
            {entry.kind === "NEWS" && (
              <>
                <label className="space-y-1 text-sm font-medium">
                  <span>{t("admin.findGuide")}</span>
                  <input
                    className={fieldClass}
                    type="search"
                    maxLength={100}
                    value={guideSearch}
                    onChange={(event) => setGuideSearch(event.target.value)}
                  />
                </label>
                <label className="space-y-1 text-sm font-medium">
                  <span>{t("relatedGuide")}</span>
                  <select
                    className={fieldClass}
                    value={revision.guideId ?? ""}
                    onChange={(event) =>
                      update({ guideId: event.target.value || null })
                    }
                  >
                    <option value="">{t("admin.none")}</option>
                    {revision.guideId &&
                      !guides.some(
                        (guide) => guide.id === revision.guideId,
                      ) && (
                        <option value={revision.guideId}>
                          {t("admin.selectedGuide")}
                        </option>
                      )}
                    {guides.map((guide) => (
                      <option key={guide.id} value={guide.id}>
                        {guide.published?.titleEs}
                      </option>
                    ))}
                  </select>
                  {guideQuery.loading && (
                    <span role="status" className="text-xs">
                      {t("loading")}
                    </span>
                  )}
                  {guideQuery.error && (
                    <span role="alert" className="text-xs">
                      {t("admin.guideLoadError")}
                    </span>
                  )}
                </label>
              </>
            )}
          </fieldset>
          <p className="text-sm text-muted-foreground">{t("admin.bodyHelp")}</p>
          <div className="grid gap-5 lg:grid-cols-2">
            {(["es", "en"] as const).map((language) => (
              <fieldset
                key={language}
                disabled={disabled}
                className="min-w-0 space-y-3 rounded-xl border border-border p-4"
              >
                <legend className="px-1 text-sm font-bold">
                  {t(language === "es" ? "admin.spanish" : "admin.english")}
                </legend>
                {textFields.map(({ key, max, ...names }) => (
                  <label
                    key={key}
                    className="block space-y-1 text-sm font-medium"
                  >
                    <span>{t(`admin.fields.${key}`)}</span>
                    {key === "title" ? (
                      <input
                        className={fieldClass}
                        maxLength={max}
                        value={revision[names[language]] ?? ""}
                        onChange={(event) =>
                          update({ [names[language]]: event.target.value })
                        }
                      />
                    ) : (
                      <textarea
                        className={fieldClass}
                        maxLength={max}
                        rows={key === "body" ? 8 : 3}
                        value={revision[names[language]] ?? ""}
                        onChange={(event) =>
                          update({ [names[language]]: event.target.value })
                        }
                      />
                    )}
                  </label>
                ))}
              </fieldset>
            ))}
          </div>
          <DraftFiles
            entryId={entry.id}
            role={role}
            files={revision.files}
            onChange={(files) => update({ files })}
            busy={disabled}
            onBusy={setUploading}
          />
        </div>
      )}
      <div className="flex flex-wrap gap-2 border-t border-border pt-4">
        <button
          type="button"
          className={primaryClass}
          disabled={disabled || !dirty}
          onClick={() => void perform("save")}
        >
          {t("admin.save")}
        </button>
        <button
          type="button"
          className={buttonClass}
          disabled={
            disabled || dirty || (!entry.draft && entry.status !== "ARCHIVED")
          }
          onClick={() => void perform("publish")}
        >
          {t(entry.status === "ARCHIVED" ? "admin.republish" : "admin.publish")}
        </button>
        {entry.status === "PUBLISHED" && (
          <>
            {entry.kind === "NEWS" && (
              <button
                type="button"
                className={buttonClass}
                disabled={disabled || dirty}
                onClick={() => void perform("highlight")}
              >
                {t(entry.featured ? "admin.unhighlight" : "admin.highlight")}
              </button>
            )}
            <button
              type="button"
              className={buttonClass}
              disabled={disabled || dirty || confirmArchive}
              onClick={() => setConfirmArchive(true)}
            >
              {t("admin.archive")}
            </button>
          </>
        )}
        <button
          type="button"
          className={buttonClass}
          disabled={disabled}
          onClick={() => {
            if (!dirty || window.confirm(t("admin.reloadConfirm")))
              void perform("reload");
          }}
        >
          {t("admin.reload")}
        </button>
      </div>
      {confirmArchive && (
        <div
          role="group"
          aria-label={t("admin.archive")}
          className="space-y-2 rounded-xl border border-border bg-card p-4"
        >
          <p>{t("admin.archiveConfirm")}</p>
          <div className="flex gap-2">
            <button
              type="button"
              className={primaryClass}
              disabled={disabled || dirty}
              onClick={() => void perform("archive")}
            >
              {t("admin.confirmArchive")}
            </button>
            <button
              type="button"
              className={buttonClass}
              disabled={disabled}
              onClick={() => setConfirmArchive(false)}
            >
              {t("admin.cancel")}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
