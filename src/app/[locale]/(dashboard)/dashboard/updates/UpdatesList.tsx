"use client";

import { useDeferredValue, useState } from "react";
import { useQuery } from "@apollo/client/react";
import { ArrowUpRight, BookOpen, FileText, Video } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import PaginationControls from "@/components/ui/PaginationControls";
import { Link } from "@/i18n/routing";
import { createApiGraphqlClient } from "@/lib/graphql-client";
import { useActiveRole } from "@/context/ActiveRoleContext";
import { EditorialDate } from "@/features/editorial/EditorialContent";
import { FEATURED, PUBLICATIONS } from "@/features/editorial/graphql";
import {
  buttonClass,
  editorialFormats,
  editorialText,
  editorialTopics,
  fieldClass,
  publicationHref,
  roleHeaders,
} from "@/features/editorial/presentation";
import type {
  EditorialFormat,
  EditorialKind,
  EditorialPublication,
  EditorialTopic,
} from "@/features/editorial/schema-types";

const pageSize = 12;

function PublicationCard({
  item,
  featured = false,
}: {
  item: EditorialPublication;
  featured?: boolean;
}) {
  const t = useTranslations("Editorial");
  const locale = useLocale();
  if (!item.published) return null;
  const { topic, files } = item.published;
  const copy = editorialText(item.published, locale);
  return (
    <article
      className={`min-w-0 rounded-xl border p-5 ${featured ? "border-secondary/35 bg-secondary/8" : "border-border bg-card"}`}
    >
      <p className="mb-2 flex flex-wrap gap-x-3 gap-y-1 text-xs font-semibold text-muted-foreground">
        {featured && <span className="text-primary">{t("featured")}</span>}
        {topic && <span>{t(`topic.${topic}`)}</span>}
        {item.firstPublishedAt && (
          <EditorialDate date={item.firstPublishedAt} />
        )}
      </p>
      <h3>
        <Link
          href={publicationHref(item.kind, item.id)}
          lang={copy.lang}
          className="inline-flex items-start gap-2 break-words text-lg font-bold text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus"
        >
          {copy.title}
          <ArrowUpRight
            className="mt-1 shrink-0"
            size={16}
            aria-hidden="true"
          />
        </Link>
      </h3>
      <p
        lang={copy.lang}
        className="mt-2 break-words text-sm leading-relaxed text-muted-foreground"
      >
        {copy.summary}
      </p>
      {item.kind === "GUIDE" && (
        <div className="mt-4 flex flex-wrap gap-3 text-xs font-medium text-muted-foreground">
          {copy.body && (
            <span className="inline-flex items-center gap-1.5">
              <BookOpen size={14} aria-hidden="true" />
              {t("format.TEXT")}
            </span>
          )}
          {files.some((file) => file.kind === "PDF") && (
            <span className="inline-flex items-center gap-1.5">
              <FileText size={14} aria-hidden="true" />
              {t("format.PDF")}
            </span>
          )}
          {files.some((file) => file.kind === "VIDEO") && (
            <span className="inline-flex items-center gap-1.5">
              <Video size={14} aria-hidden="true" />
              {t("format.VIDEO")}
            </span>
          )}
        </div>
      )}
    </article>
  );
}

export default function UpdatesList(props: {
  kind: EditorialKind;
  initialTopic?: EditorialTopic;
}) {
  const { activeRole } = useActiveRole();
  return <RoleUpdatesList key={activeRole} {...props} role={activeRole} />;
}

function RoleUpdatesList({
  kind,
  initialTopic,
  role,
}: {
  kind: EditorialKind;
  initialTopic?: EditorialTopic;
  role: string | null;
}) {
  const t = useTranslations("Editorial");
  const [client] = useState(createApiGraphqlClient);
  const [search, setSearch] = useState("");
  const [topic, setTopic] = useState(initialTopic);
  const [format, setFormat] = useState<EditorialFormat>();
  const [page, setPage] = useState(1);
  const query = useDeferredValue(search.trim());
  const showFeatured = kind === "NEWS" && !query && !topic && page === 1;
  const context = { headers: roleHeaders(role) };
  const { data, loading, error, refetch } = useQuery(PUBLICATIONS, {
    client,
    context,
    fetchPolicy: "no-cache",
    variables: {
      filters: {
        kind,
        topic,
        format,
        search: query || undefined,
        page,
        pageSize,
      },
    },
  });
  const { data: featuredData } = useQuery(FEATURED, {
    client,
    context,
    fetchPolicy: "no-cache",
    skip: !showFeatured,
  });
  const featured = showFeatured
    ? featuredData?.editorialFeaturedPublication
    : null;
  const result = data?.editorialPublications;
  return (
    <section className="space-y-4" aria-busy={loading}>
      {featured && <PublicationCard item={featured} featured />}
      <h2 className="text-xl font-bold">
        {t(kind === "NEWS" ? "history" : "guides")}
      </h2>
      <div className="grid gap-3 rounded-xl border border-border bg-card p-4 sm:grid-cols-[2fr_1fr_1fr]">
        <label className="space-y-1 text-sm font-medium">
          <span>{t("search")}</span>
          <input
            type="search"
            maxLength={100}
            value={search}
            onChange={(event) => {
              setSearch(event.target.value);
              setPage(1);
            }}
            className={fieldClass}
          />
        </label>
        <label className="space-y-1 text-sm font-medium">
          <span>{t("module")}</span>
          <select
            value={topic ?? ""}
            onChange={(event) => {
              setTopic(
                editorialTopics.find((option) => option === event.target.value),
              );
              setPage(1);
            }}
            className={fieldClass}
          >
            <option value="">{t("allModules")}</option>
            {editorialTopics.map((option) => (
              <option key={option} value={option}>
                {t(`topic.${option}`)}
              </option>
            ))}
          </select>
        </label>
        {kind === "GUIDE" && (
          <label className="space-y-1 text-sm font-medium">
            <span>{t("formatLabel")}</span>
            <select
              value={format ?? ""}
              onChange={(event) => {
                setFormat(
                  editorialFormats.find(
                    (option) => option === event.target.value,
                  ),
                );
                setPage(1);
              }}
              className={fieldClass}
            >
              <option value="">{t("allFormats")}</option>
              {editorialFormats.map((option) => (
                <option key={option} value={option}>
                  {t(`format.${option}`)}
                </option>
              ))}
            </select>
          </label>
        )}
      </div>
      {loading ? (
        <p
          role="status"
          className="rounded-xl border border-border bg-card p-5 text-muted-foreground"
        >
          {t("loading")}
        </p>
      ) : error ? (
        <div
          role="alert"
          className="space-y-3 rounded-xl border border-border bg-card p-5"
        >
          <p>{t("loadError")}</p>
          <button
            type="button"
            className={buttonClass}
            onClick={() => void refetch().catch(() => undefined)}
          >
            {t("retry")}
          </button>
        </div>
      ) : result?.items.length ? (
        <>
          <div className="grid gap-3 md:grid-cols-2">
            {result.items.map((item) => (
              <PublicationCard key={item.id} item={item} />
            ))}
          </div>
          <PaginationControls
            page={page}
            totalPages={Math.ceil(result.total / pageSize)}
            totalItems={result.total}
            onPageChange={setPage}
          />
        </>
      ) : (
        <p
          role="status"
          className="rounded-xl border border-dashed border-border p-6 text-muted-foreground"
        >
          {t(
            query || topic || format
              ? "noMatches"
              : kind === "NEWS"
                ? "emptyNews"
                : "emptyGuides",
          )}
        </p>
      )}
    </section>
  );
}
