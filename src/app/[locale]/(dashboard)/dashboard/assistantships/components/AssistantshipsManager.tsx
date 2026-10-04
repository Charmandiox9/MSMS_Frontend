"use client";
import { useEffect, useState } from "react";
import { ApolloClient, HttpLink, InMemoryCache } from "@apollo/client";
import { ApolloProvider, useQuery } from "@apollo/client/react";
import {
  CalendarDays,
  ClipboardList,
  Loader2,
  Plus,
  Search,
  UsersRound,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { useActiveRole } from "@/context/ActiveRoleContext";
import { resolveApiBaseUrl } from "@/lib/runtime-config";
import {
  HISTORY,
  OPTIONS,
  type AssistantshipState,
  type Filters,
} from "../graphql";
import { buttonClass, Field, inputClass, primaryClass } from "./controls";
import AssistantshipsTable from "./AssistantshipsTable";
import RegisterAssistantshipDialog from "./RegisterAssistantshipDialog";

function createClient() {
  return new ApolloClient({
    cache: new InMemoryCache(),
    link: new HttpLink({
      uri: "/api/graphql",
      credentials: "include",
      fetch: async (_uri, options) => {
        const base = await resolveApiBaseUrl();
        if (!base) throw new Error("API_NOT_CONFIGURED");
        return fetch(`${base}/graphql`, options);
      },
    }),
  });
}
export default function AssistantshipsManager() {
  const t = useTranslations("AssistantshipsPage");
  const { activeRole } = useActiveRole();
  const [client] = useState(createClient);
  if (!activeRole)
    return (
      <p role="status" className="py-12 text-center text-muted-foreground">
        {t("loading")}
      </p>
    );
  if (
    activeRole !== "TEACHING_SUPPORT_COORDINATOR" &&
    activeRole !== "SYSTEM_ADMIN"
  )
    return (
      <p role="alert" className="py-12 text-center text-muted-foreground">
        {t("errors.ACCESS_DENIED")}
      </p>
    );
  return (
    <ApolloProvider client={client}>
      <AssistantshipsWorkspace />
    </ApolloProvider>
  );
}
export function AssistantshipsWorkspace() {
  const t = useTranslations("AssistantshipsPage");
  const [filters, setFilters] = useState<Filters>({
    search: "",
    page: 1,
    pageSize: 20,
  });
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const options = useQuery(OPTIONS, { fetchPolicy: "network-only" });
  const history = useQuery(HISTORY, {
    variables: { filters },
    fetchPolicy: "network-only",
    notifyOnNetworkStatusChange: true,
  });
  useEffect(() => {
    const timeout = setTimeout(
      () =>
        setFilters((current) =>
          current.search === search.trim()
            ? current
            : { ...current, search: search.trim(), page: 1 },
        ),
      300,
    );
    return () => clearTimeout(timeout);
  }, [search]);
  const update = (patch: Partial<Filters>) =>
    setFilters((current) => ({ ...current, ...patch, page: 1 }));
  const page = history.data?.assistantships;
  const failed = Boolean(history.error || options.error);
  const busy = history.loading || options.loading;
  const stats = [
    { key: "records", value: page?.total, icon: ClipboardList },
    { key: "assistants", value: page?.assistants, icon: UsersRound },
    { key: "semesters", value: page?.semesters, icon: CalendarDays },
  ];
  const retry = () => {
    void Promise.allSettled([history.refetch(), options.refetch()]);
  };
  return (
    <section className="space-y-6">
      <header className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-secondary">
            {t("eyebrow")}
          </p>
          <h1 className="mt-2 text-3xl font-black tracking-tight text-foreground">
            {t("title")}
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
            {t("subtitle")}
          </p>
        </div>
        <button
          type="button"
          className={primaryClass}
          disabled={!options.data || failed}
          onClick={() => setDialogOpen(true)}
        >
          <Plus className="h-4 w-4" aria-hidden="true" />
          {t("register")}
        </button>
      </header>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3" aria-busy={busy}>
        {stats.map(({ key, value, icon: Icon }) => (
          <div
            key={key}
            className="flex items-center gap-4 rounded-2xl border border-border bg-card p-4"
          >
            <div className="rounded-xl bg-secondary/10 p-3 text-secondary">
              <Icon className="h-5 w-5" aria-hidden="true" />
            </div>
            <div>
              <p className="text-2xl font-bold tabular-nums text-foreground">
                {busy || failed ? "—" : (value ?? 0)}
              </p>
              <p className="text-xs text-muted-foreground">
                {t(`stats.${key}`)}
              </p>
            </div>
          </div>
        ))}
      </div>
      <section className="overflow-hidden rounded-3xl border border-border bg-card">
        <div className="space-y-5 border-b border-border p-5">
          <div>
            <h2 className="text-lg font-bold text-foreground">
              {t("history.title")}
            </h2>
            <p className="mt-1 text-xs text-muted-foreground">
              {t("history.subtitle")}
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-[minmax(240px,2fr)_1fr_1fr_1fr]">
            <Field label={t("filters.search")} htmlFor="assistantship-search">
              <div className="relative">
                <Search
                  className="pointer-events-none absolute left-3 top-3.5 h-4 w-4 text-muted-foreground"
                  aria-hidden="true"
                />
                <input
                  id="assistantship-search"
                  type="search"
                  className={`${inputClass} pl-9`}
                  value={search}
                  placeholder={t("filters.searchPlaceholder")}
                  onChange={(event) => setSearch(event.target.value)}
                />
              </div>
            </Field>
            <Field
              label={t("filters.semester")}
              htmlFor="assistantship-semester"
            >
              <select
                id="assistantship-semester"
                className={inputClass}
                value={filters.semesterId ?? ""}
                onChange={(event) =>
                  update({ semesterId: event.target.value || undefined })
                }
              >
                <option value="">{t("filters.allSemesters")}</option>
                {options.data?.assistantshipOptions.semesters.map(
                  (semester) => (
                    <option key={semester.id} value={semester.id}>
                      {semester.name}
                    </option>
                  ),
                )}
              </select>
            </Field>
            <Field label={t("filters.teacher")} htmlFor="assistantship-teacher">
              <select
                id="assistantship-teacher"
                className={inputClass}
                value={filters.teacherId ?? ""}
                onChange={(event) =>
                  update({ teacherId: event.target.value || undefined })
                }
              >
                <option value="">{t("filters.allTeachers")}</option>
                {options.data?.assistantshipOptions.teachers.map((teacher) => (
                  <option key={teacher.id} value={teacher.id}>
                    {teacher.name}
                  </option>
                ))}
              </select>
            </Field>
            <Field label={t("filters.state")} htmlFor="assistantship-state">
              <select
                id="assistantship-state"
                className={inputClass}
                value={filters.state ?? ""}
                onChange={(event) =>
                  update({
                    state: (event.target.value || undefined) as
                      AssistantshipState | undefined,
                  })
                }
              >
                <option value="">{t("filters.allStates")}</option>
                {(["ACTIVE", "SCHEDULED", "COMPLETED"] as const).map(
                  (state) => (
                    <option key={state} value={state}>
                      {t(`states.${state}`)}
                    </option>
                  ),
                )}
              </select>
            </Field>
          </div>
        </div>
        {failed ? (
          <div role="alert" className="space-y-3 p-10 text-center">
            <p className="text-sm text-coral-red">{t("errors.load")}</p>
            <button type="button" className={buttonClass} onClick={retry}>
              {t("retry")}
            </button>
          </div>
        ) : busy ? (
          <div
            role="status"
            className="flex items-center justify-center gap-3 py-20 text-sm text-muted-foreground"
          >
            <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" />
            {t("loading")}
          </div>
        ) : page?.items.length ? (
          <>
            <AssistantshipsTable items={page.items} />
            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border p-4">
              <p className="text-xs tabular-nums text-muted-foreground">
                {t("pagination.summary", {
                  page: page.page,
                  pages: page.totalPages,
                  count: page.total,
                })}
              </p>
              <div className="flex gap-2">
                <button
                  type="button"
                  className={buttonClass}
                  disabled={page.page <= 1}
                  onClick={() =>
                    setFilters((current) => ({
                      ...current,
                      page: page.page - 1,
                    }))
                  }
                >
                  {t("pagination.previous")}
                </button>
                <button
                  type="button"
                  className={buttonClass}
                  disabled={page.page >= page.totalPages}
                  onClick={() =>
                    setFilters((current) => ({
                      ...current,
                      page: page.page + 1,
                    }))
                  }
                >
                  {t("pagination.next")}
                </button>
              </div>
            </div>
          </>
        ) : (
          <div role="status" className="px-6 py-16 text-center">
            <ClipboardList
              className="mx-auto h-8 w-8 text-secondary/70"
              aria-hidden="true"
            />
            <p className="mt-4 text-sm font-semibold text-foreground">
              {t("history.empty")}
            </p>
            <p className="mx-auto mt-2 max-w-md text-xs text-muted-foreground">
              {t("history.emptyDescription")}
            </p>
            <button
              type="button"
              className={`${buttonClass} mt-5`}
              onClick={() => {
                setSearch("");
                setFilters({ search: "", page: 1, pageSize: 20 });
              }}
            >
              {t("filters.clear")}
            </button>
          </div>
        )}
      </section>
      <p className="text-xs text-muted-foreground">{t("stats.scope")}</p>
      {dialogOpen && options.data && (
        <RegisterAssistantshipDialog
          semesters={options.data.assistantshipOptions.semesters}
          initialSemesterId={filters.semesterId}
          onClose={() => setDialogOpen(false)}
          onRegistered={(semesterId) => {
            setDialogOpen(false);
            setSearch("");
            setFilters({ semesterId, search: "", page: 1, pageSize: 20 });
            void history
              .refetch({
                filters: { semesterId, search: "", page: 1, pageSize: 20 },
              })
              .catch(() => undefined);
          }}
        />
      )}
    </section>
  );
}
