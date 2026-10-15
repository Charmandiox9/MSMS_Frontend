"use client";

import { useEffect, useState } from "react";
import {
  MetricsSkeleton,
  PageSkeleton,
  TableSkeleton,
} from "@/components/ui/LoadingSkeletons";
import { ApolloClient, HttpLink, InMemoryCache } from "@apollo/client";
import { ApolloProvider, useQuery } from "@apollo/client/react";
import {
  CalendarDays,
  ClipboardList,
  Download,
  Plus,
  Search,
  UsersRound,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { useActiveRole } from "@/context/ActiveRoleContext";
import { resolveApiBaseUrl } from "@/lib/runtime-config";
import {
  HISTORY,
  OPTIONS,
  type AssistantshipState,
  type Filters,
  type Assistantship,
} from "../graphql";
import { buttonClass, Field, inputClass, primaryClass } from "./controls";
import AssistantshipsTable from "./AssistantshipsTable";
import AssistantshipDetailModal from "./AssistantshipDetailModal";
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

  if (!activeRole) return <PageSkeleton label={t("loading")} />;
  if (
    activeRole !== "TEACHING_SUPPORT_COORDINATOR" &&
    activeRole !== "SYSTEM_ADMIN" &&
    activeRole !== "ACADEMIC_SECRETARY" &&
    activeRole !== "ACADEMIC_PROCESS_ANALYST"
  )
    return (
      <p role="alert" className="py-12 text-center text-muted-foreground">
        {t("errors.ACCESS_DENIED")}
      </p>
    );

  return (
    <ApolloProvider client={client}>
      <AssistantshipsWorkspace
        readOnly={activeRole === "ACADEMIC_PROCESS_ANALYST"}
      />
    </ApolloProvider>
  );
}

export function AssistantshipsWorkspace({
  readOnly = false,
}: {
  readOnly?: boolean;
}) {
  const t = useTranslations("AssistantshipsPage");
  const [filters, setFilters] = useState<Filters>({
    search: "",
    page: 1,
    pageSize: 20,
  });
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Assistantship | null>(null);
  const [detailItem, setDetailItem] = useState<Assistantship | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);

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

  const exportHistoryCsv = () => {
    if (!page?.items?.length) return;
    const headers = [
      t("table.assistant"),
      t("form.email"),
      t("form.studentCode"),
      t("table.course"),
      "Código Asignatura",
      "NRC Asignatura",
      t("form.assistantshipNrc"),
      t("filters.teacher"),
      t("filters.semester"),
      t("form.approvedOn"),
      t("form.startsOn"),
      t("form.endsOn"),
      t("form.hours"),
      t("filters.state"),
      t("table.schedule"),
    ];

    const formatSchedule = (item: Assistantship) => {
      if (!item.schedules.length) return t("table.noSchedule");
      return item.schedules
        .map((s) => {
          const dayName = t(`days.${s.weekday}`);
          const block = options.data?.assistantshipOptions.blocks.find(
            (b) =>
              b.startsAtMinute === s.startsAtMinute &&
              b.endsAtMinute === s.endsAtMinute,
          )?.code;
          const blockStr = block ? `${block} · ` : "";
          const start = `${String(Math.floor(s.startsAtMinute / 60)).padStart(2, "0")}:${String(s.startsAtMinute % 60).padStart(2, "0")}`;
          const end = `${String(Math.floor(s.endsAtMinute / 60)).padStart(2, "0")}:${String(s.endsAtMinute % 60).padStart(2, "0")}`;
          const loc = s.location ? ` (${s.location})` : "";
          return `${dayName} ${blockStr}${start}-${end}${loc}`;
        })
        .join(" | ");
    };

    const rows = page.items.map((item) => [
      `"${(item.assistantName || "").replace(/"/g, '""')}"`,
      `"${(item.assistantEmail || "").replace(/"/g, '""')}"`,
      `"${(item.studentCode || "").replace(/"/g, '""')}"`,
      `"${(item.courseName || "").replace(/"/g, '""')}"`,
      `"${(item.courseCode || "").replace(/"/g, '""')}"`,
      `"${item.nrc}"`,
      `"${item.assistantshipNrc || ""}"`,
      `"${(item.teacherName || "").replace(/"/g, '""')}"`,
      `"${(item.semesterName || "").replace(/"/g, '""')}"`,
      `"${item.approvedOn || ""}"`,
      `"${item.startsOn || ""}"`,
      `"${item.endsOn || ""}"`,
      item.weeklyHours !== null ? `${item.weeklyHours}` : "",
      `"${t(`states.${item.state}`)}"`,
      `"${formatSchedule(item).replace(/"/g, '""')}"`,
    ]);

    const csvContent =
      "\uFEFF" +
      [headers.join(";"), ...rows.map((row) => row.join(";"))].join("\r\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    const dateStr = new Date().toISOString().split("T")[0];
    link.download = `historial_ayudantias_fcm_${dateStr}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    toast.success(t("history.exportSuccess"));
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
        <div className="flex flex-wrap items-center gap-2.5">
          {!readOnly && (
            <button
              type="button"
              className={primaryClass}
              disabled={!options.data || failed}
              onClick={() => {
                setEditing(null);
                setDialogOpen(true);
              }}
            >
              <Plus className="h-4 w-4" aria-hidden="true" />
              {t("register")}
            </button>
          )}
          <button
            type="button"
            className="btn-cta-secondary"
            disabled={!page?.items?.length}
            onClick={exportHistoryCsv}
            title={t("history.export")}
          >
            <Download className="h-4 w-4" aria-hidden="true" />
            {t("history.export")}
          </button>
        </div>
      </header>

      {busy ? (
        <MetricsSkeleton
          count={3}
          compact
          className="grid grid-cols-1 gap-3 sm:grid-cols-3"
          label={t("loading")}
        />
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
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
                  {failed ? "—" : (value ?? 0)}
                </p>
                <p className="text-xs text-muted-foreground">
                  {t(`stats.${key}`)}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}

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
          <TableSkeleton
            columns={6}
            label={t("loading")}
            className="rounded-none border-0"
          />
        ) : page?.items.length ? (
          <>
            <AssistantshipsTable
              items={page.items}
              blocks={options.data?.assistantshipOptions.blocks ?? []}
              onView={(item) => {
                setDetailItem(item);
                setDetailOpen(true);
              }}
              onEdit={
                readOnly
                  ? undefined
                  : (item) => {
                      setEditing(item);
                      setDialogOpen(true);
                    }
              }
            />
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

      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <p className="text-xs text-muted-foreground">{t("stats.scope")}</p>
      </div>

      {detailOpen && detailItem && (
        <AssistantshipDetailModal
          isOpen={detailOpen}
          item={detailItem}
          blocks={options.data?.assistantshipOptions.blocks ?? []}
          onClose={() => {
            setDetailOpen(false);
            setDetailItem(null);
          }}
          onEdit={
            readOnly
              ? undefined
              : (item) => {
                  setDetailOpen(false);
                  setEditing(item);
                  setDialogOpen(true);
                }
          }
        />
      )}

      {dialogOpen && options.data && (
        <RegisterAssistantshipDialog
          key={editing?.id ?? "new"}
          initialRecord={editing ?? undefined}
          semesters={options.data.assistantshipOptions.semesters}
          blocks={options.data.assistantshipOptions.blocks}
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
