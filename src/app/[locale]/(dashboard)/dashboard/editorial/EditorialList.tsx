"use client";

import { useDeferredValue, useState } from "react";
import { useQuery } from "@apollo/client/react";
import { Plus } from "lucide-react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import PaginationControls from "@/components/ui/PaginationControls";
import { useActiveRole } from "@/context/ActiveRoleContext";
import { Link, useRouter } from "@/i18n/routing";
import { createApiGraphqlClient } from "@/lib/graphql-client";
import { EditorialDate } from "@/features/editorial/EditorialContent";
import { CREATE, MANAGED } from "@/features/editorial/graphql";
import {
  buttonClass,
  fieldClass,
  linkClass,
  primaryClass,
  roleHeaders,
} from "@/features/editorial/presentation";
import type { EditorialKind } from "@/features/editorial/schema-types";

const pageSize = 15;

export default function EditorialList() {
  const { activeRole } = useActiveRole();
  return <RoleEditorialList key={activeRole} activeRole={activeRole} />;
}

function RoleEditorialList({ activeRole }: { activeRole: string | null }) {
  const t = useTranslations("Editorial");
  const router = useRouter();
  const [client] = useState(createApiGraphqlClient);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [creating, setCreating] = useState(false);
  const term = useDeferredValue(search.trim());
  const context = { headers: roleHeaders(activeRole) };
  const { data, loading, error, refetch } = useQuery(MANAGED, {
    client,
    context,
    fetchPolicy: "no-cache",
    variables: { filters: { search: term || undefined, page, pageSize } },
  });
  const entries = data?.editorialManagedEntries;

  async function create(kind: EditorialKind) {
    setCreating(true);
    const operation = client.mutate({
      mutation: CREATE,
      variables: { kind },
      context,
    });
    toast.promise(operation, {
      loading: t("admin.creating"),
      success: t("admin.created"),
      error: t("admin.createError"),
    });
    try {
      const result = await operation;
      if (result.data)
        router.push(
          `/dashboard/editorial/${result.data.createEditorialEntry.id}`,
        );
    } catch {
      /* Sonner reports the failure. */
    } finally {
      setCreating(false);
    }
  }

  return (
    <section className="space-y-4" aria-busy={loading}>
      {!error && (
        <div className="flex flex-wrap items-end gap-3">
          <label className="min-w-48 flex-1 space-y-1 text-sm font-medium">
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
          <button
            type="button"
            className={primaryClass}
            disabled={loading || creating}
            onClick={() => void create("NEWS")}
          >
            <Plus size={16} aria-hidden="true" />
            {t("admin.newNews")}
          </button>
          <button
            type="button"
            className={buttonClass}
            disabled={loading || creating}
            onClick={() => void create("GUIDE")}
          >
            <Plus size={16} aria-hidden="true" />
            {t("admin.newGuide")}
          </button>
        </div>
      )}
      {loading ? (
        <p role="status">{t("loading")}</p>
      ) : error ? (
        <div
          role="alert"
          className="space-y-3 rounded-xl border border-border bg-card p-4"
        >
          <p>{t("admin.loadError")}</p>
          <button
            type="button"
            className={buttonClass}
            onClick={() => void refetch().catch(() => undefined)}
          >
            {t("retry")}
          </button>
        </div>
      ) : entries?.items.length ? (
        <>
          <ul className="divide-y divide-border overflow-hidden rounded-xl border border-border bg-card">
            {entries.items.map((entry) => (
              <li
                key={entry.id}
                className="grid gap-2 p-4 sm:grid-cols-[1fr_auto] sm:items-center"
              >
                <div className="min-w-0 space-y-1">
                  <Link
                    href={`/dashboard/editorial/${entry.id}`}
                    className={`${linkClass} break-words`}
                  >
                    {(entry.draft ?? entry.published)?.titleEs || t("untitled")}
                  </Link>
                  <p className="text-sm text-muted-foreground">
                    {t(`kind.${entry.kind}`)} ·{" "}
                    <EditorialDate date={entry.updatedAt} />
                  </p>
                </div>
                <div className="flex flex-wrap gap-2 text-xs font-semibold">
                  <span className="rounded-md bg-muted px-2 py-1">
                    {t(`status.${entry.status}`)}
                  </span>
                  {entry.draft && entry.status === "PUBLISHED" && (
                    <span className="rounded-md bg-muted px-2 py-1">
                      {t("admin.pendingRevision")}
                    </span>
                  )}
                  {entry.featured && (
                    <span className="rounded-md bg-primary/10 px-2 py-1 text-primary">
                      {t("featured")}
                    </span>
                  )}
                </div>
              </li>
            ))}
          </ul>
          <PaginationControls
            page={page}
            totalPages={Math.ceil(entries.total / pageSize)}
            totalItems={entries.total}
            onPageChange={setPage}
          />
        </>
      ) : (
        <p
          role="status"
          className="rounded-xl border border-dashed border-border p-5 text-muted-foreground"
        >
          {t(term ? "noMatches" : "admin.empty")}
        </p>
      )}
    </section>
  );
}
