"use client";

import { useCallback, useEffect, useRef, useState, type FormEvent } from "react";
import { ApolloClient, HttpLink, InMemoryCache } from "@apollo/client";
import { FileText, Pencil, Plus, Search, Trash2 } from "lucide-react";
import { useFormatter, useTranslations } from "next-intl";
import { toast } from "sonner";
import { useActiveRole } from "@/context/ActiveRoleContext";
import { apiFetch } from "@/lib/api";
import { resolveApiBaseUrl } from "@/lib/runtime-config";
import Modal from "@/components/ui/Modal";
import PaginationControls from "@/components/ui/PaginationControls";
import { PageSkeleton, TableSkeleton } from "@/components/ui/LoadingSkeletons";
import type { ResearchOption, ResearchOutputKind, ResearchOutputRecord } from "@/types/research-output";
import { fieldClass, primaryButton, secondaryButton } from "./repository-fields";
import { RESEARCH_OUTPUTS, REPOSITORY_RESEARCH, RESEARCH_OUTPUT_DETAIL } from "./repository-queries";

type Dialog = { mode: "create" } | { mode: "edit" | "details" | "delete"; row: ResearchOutputRecord } | null;
const kinds: ResearchOutputKind[] = ["ARTICLE", "BOOK", "BOOK_CHAPTER", "INTELLECTUAL_PROPERTY"];

function createRepositoryClient() {
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

async function loadResearchOptions(client: ApolloClient, errorMessage: string) {
  const filters = { page: 1, pageSize: 100, search: "", sortBy: "title", sortOrder: "asc" as const };
  const first = await client.query({ query: REPOSITORY_RESEARCH, variables: { filters }, fetchPolicy: "cache-first" });
  if (!first.data) throw new Error(errorMessage);
  const firstPage = first.data.repositoryResearch;
  const rows: ResearchOption[] = firstPage.items.map(({ id, title, code }) => ({ id, title, code }));
  for (let current = 2; current <= firstPage.totalPages; current++) {
    const page = await client.query({ query: REPOSITORY_RESEARCH, variables: { filters: { ...filters, page: current } }, fetchPolicy: "cache-first" });
    if (!page.data) throw new Error(errorMessage);
    rows.push(...page.data.repositoryResearch.items.map(({ id, title, code }) => ({ id, title, code })));
  }
  return rows;
}

export default function ResearchOutputsPage() {
  const t = useTranslations("AcademicRepository.outputs");
  const common = useTranslations("AcademicRepository");
  const format = useFormatter();
  const { activeRole } = useActiveRole();
  const [graphqlClient] = useState(createRepositoryClient);
  const allowed = ["SYSTEM_ADMIN", "ACADEMIC_SECRETARY", "ACADEMIC_PROCESS_ANALYST"].includes(activeRole ?? "");
  const [rows, setRows] = useState<ResearchOutputRecord[]>([]);
  const [researches, setResearches] = useState<ResearchOption[]>([]);
  const [researchId, setResearchId] = useState("");
  const [search, setSearch] = useState("");
  const [kind, setKind] = useState("");
  const [year, setYear] = useState("");
  const [sortBy, setSortBy] = useState("reportingYear");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reload, setReload] = useState(0);
  const [dialog, setDialog] = useState<Dialog>(null);
  const [busy, setBusy] = useState(false);
  const lastInvalidYearToast = useRef("");
  const refresh = useCallback(() => { setLoading(true); setReload((n) => n + 1); }, []);

  useEffect(() => {
    if (!allowed) return;
    let active = true;
    const numericYear = Number(year);
    const invalidYear = year !== "" && (!/^\d{4}$/.test(year) || numericYear < 1900 || numericYear > 2200);
    if (invalidYear) {
      setRows([]); setTotal(0); setTotalPages(1); setError(null); setLoading(false);
      if (lastInvalidYearToast.current !== year) {
        toast.error(common("invalidYearToast"));
        lastInvalidYearToast.current = year;
      }
      return () => { active = false; };
    }
    lastInvalidYearToast.current = "";
    const filters = {
      page,
      pageSize: 10,
      search: search.trim(),
      sortBy,
      sortOrder,
      ...(researchId ? { researchId } : {}),
      ...(kind ? { kind: kind as ResearchOutputKind } : {}),
      ...(year ? { reportingYear: numericYear } : {}),
    };
    void Promise.all([
      graphqlClient.query({ query: RESEARCH_OUTPUTS, variables: { filters }, fetchPolicy: "network-only" }),
      loadResearchOptions(graphqlClient, common("loadError")),
    ]).then(([result, researchData]) => {
      if (!active) return;
      if (!result.data) throw new Error(common("loadError"));
      const data = result.data.repositoryResearchOutputs;
      const pages = Math.max(1, data.totalPages);
      if (page > pages) { setPage(pages); return; }
      setRows(data.items); setTotal(data.total); setTotalPages(pages);
      setResearches(researchData); setError(null);
    }).catch((cause: unknown) => {
      if (active) setError(cause instanceof Error ? cause.message : common("loadError"));
    }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [allowed, graphqlClient, page, researchId, search, kind, year, sortBy, sortOrder, reload, common]);

  const open = async (mode: 'details' | 'edit' | 'delete', row: ResearchOutputRecord) => {
    if (busy) return;
    setBusy(true);
    try {
      const result = await graphqlClient.query({ query: RESEARCH_OUTPUT_DETAIL, variables: { id: row.id }, fetchPolicy: 'no-cache' });
      if (!result.data) throw new Error(common('loadError'));
      setDialog({ mode, row: result.data.repositoryResearchOutput });
    } catch (cause: unknown) {
      toast.error(cause instanceof Error ? cause.message : common('loadError'));
    } finally {
      setBusy(false);
    }
  };

  const remove = async () => {
    if (dialog?.mode !== "delete" || busy) return;
    setBusy(true);
    const query = new URLSearchParams({ expectedUpdatedAt: dialog.row.updatedAt });
    const operation = apiFetch(`/academic/research-outputs/${dialog.row.id}?${query}`, { method: "DELETE" });
    toast.promise(operation, { loading: t("deleting"), success: t("deleted"), error: (cause: unknown) => cause instanceof Error ? cause.message : t("deleteError") });
    try { await operation; setDialog(null); refresh(); } catch { /* feedback via toast */ } finally { setBusy(false); }
  };

  if (activeRole === null) return <PageSkeleton label={common("loading")} />;
  if (!allowed) return <p className="py-16 text-center text-sm text-muted-foreground">{common("accessError")}</p>;
  return <section className="space-y-6">
    <header className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
      <div><p className="text-xs font-bold uppercase tracking-[0.18em] text-primary">{common("eyebrow")}</p><h1 className="mt-2 flex items-center gap-3 text-3xl font-black tracking-tight"><FileText className="h-7 w-7 text-primary" />{t("title")}</h1><p className="mt-2 max-w-2xl text-sm text-muted-foreground">{t("subtitle")}</p></div>
      <button type="button" className={primaryButton} onClick={() => setDialog({ mode: "create" })}><Plus className="h-4 w-4" />{t("create")}</button>
    </header>
    <div className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-4 sm:flex-row sm:flex-wrap sm:items-end">
      <label className="min-w-48 flex-1 text-xs font-medium text-muted-foreground">{common("search")}<div className="relative"><Search className="absolute left-3 top-3 h-4 w-4" /><input className={`${fieldClass} pl-9`} maxLength={100} value={search} placeholder={t("searchHint")} onChange={(e) => { setSearch(e.target.value); setPage(1); setLoading(true); }} /></div></label>
      <label className="text-xs font-medium text-muted-foreground">{t("research")}<select className={fieldClass} value={researchId} onChange={(e) => { setResearchId(e.target.value); setPage(1); setLoading(true); }}><option value="">{t("allResearch")}</option>{researches.map((r) => <option key={r.id} value={r.id}>{r.code ? `${r.code} · ` : ""}{r.title}</option>)}</select></label>
      <label className="text-xs font-medium text-muted-foreground">{t("kind")}<select className={fieldClass} value={kind} onChange={(e) => { setKind(e.target.value); setPage(1); setLoading(true); }}><option value="">{t("allKinds")}</option>{kinds.map((value) => <option key={value} value={value}>{t(`kinds.${value}`)}</option>)}</select></label>
      <label className="text-xs font-medium text-muted-foreground">{t("year")}<input className={`${fieldClass} sm:w-28`} inputMode="numeric" maxLength={4} value={year} onChange={(e) => { setYear(e.target.value); setPage(1); setLoading(true); }} /></label>
      <label className="text-xs font-medium text-muted-foreground">{common("sortBy")}<select className={fieldClass} value={sortBy} onChange={(e) => { setSortBy(e.target.value); setPage(1); setLoading(true); }}>{["reportingYear", "title", "publicationDate", "createdAt", "kind"].map((value) => <option key={value} value={value}>{t(`sort.${value}`)}</option>)}</select></label>
      <label className="text-xs font-medium text-muted-foreground">{common("sortOrder")}<select className={fieldClass} value={sortOrder} onChange={(e) => { setSortOrder(e.target.value as "asc" | "desc"); setPage(1); setLoading(true); }}><option value="desc">{common("descending")}</option><option value="asc">{common("ascending")}</option></select></label>
    </div>
    {error ? <div role="alert" className="rounded-2xl border border-red-500/30 bg-red-500/5 p-5"><p className="text-sm">{error}</p><button type="button" className={`${secondaryButton} mt-3`} onClick={refresh}>{common("retry")}</button></div> : loading ? <TableSkeleton label={common("loading")} /> : rows.length === 0 ? <div className="rounded-2xl border border-dashed border-border bg-card p-10 text-center"><FileText className="mx-auto h-9 w-9 text-primary/60" /><h2 className="mt-4 text-lg font-bold">{t(search || researchId || kind || year ? "noMatches" : "empty")}</h2><p className="mt-2 text-sm text-muted-foreground">{t("emptyHint")}</p></div> : <div className="overflow-hidden rounded-2xl border border-border bg-card"><p className="border-b border-border px-5 py-3 text-xs font-semibold text-muted-foreground">{common("total", { count: total })}</p><ul className="divide-y divide-border">{rows.map((row) => <li key={row.id} className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between"><div className="min-w-0"><div className="mb-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground"><span className="rounded-full bg-primary/10 px-2 py-1 font-medium text-primary">{t(`kinds.${row.kind}`)}</span><span>{row.reportingYear}</span></div><button type="button" className="text-left text-base font-bold hover:text-primary" disabled={busy} onClick={() => void open("details", row)}>{row.title}</button><p className="mt-1 text-sm text-muted-foreground">{row.research?.title ?? t("unlinkedResearch")}</p><p className="mt-1 text-xs text-muted-foreground">{t("authorCount", { count: row.authors.length })}{row.publicationDate ? ` · ${format.dateTime(new Date(row.publicationDate), { dateStyle: "medium", timeZone: "UTC" })}` : ""}</p></div><div className="flex gap-2"><button type="button" className={secondaryButton} aria-label={t("editRecord", { title: row.title })} disabled={busy} onClick={() => void open("edit", row)}><Pencil className="h-4 w-4" /><span className="sr-only lg:not-sr-only">{common("edit")}</span></button><button type="button" className={`${secondaryButton} text-red-600 dark:text-red-400`} aria-label={t("deleteRecord", { title: row.title })} disabled={busy} onClick={() => void open("delete", row)}><Trash2 className="h-4 w-4" /><span className="sr-only lg:not-sr-only">{common("delete")}</span></button></div></li>)}</ul></div>}
    {!error && !loading && <PaginationControls page={page} totalPages={totalPages} totalItems={total} onPageChange={(next) => { setPage(next); setLoading(true); }} />}
    {(dialog?.mode === "create" || dialog?.mode === "edit") && <OutputEditor record={dialog.mode === "edit" ? dialog.row : null} researches={researches} onClose={() => setDialog(null)} onSaved={() => { setDialog(null); refresh(); }} />}
    {dialog?.mode === "details" && <OutputDetails row={dialog.row} onClose={() => setDialog(null)} onEdit={() => void open("edit", dialog.row)} />}
    {dialog?.mode === "delete" && <Modal isOpen title={t("deleteTitle")} description={t("deleteHint", { title: dialog.row.title })} size="md" onClose={() => !busy && setDialog(null)} closeLabel={common("close")}><div className="flex justify-end gap-3"><button type="button" className={secondaryButton} disabled={busy} onClick={() => setDialog(null)}>{common("cancel")}</button><button type="button" className={`${primaryButton} bg-red-600 text-white`} disabled={busy} onClick={() => void remove()}>{t(busy ? "deleting" : "confirmDelete")}</button></div></Modal>}
  </section>;
}

function OutputEditor({ record, researches, onClose, onSaved }: { record: ResearchOutputRecord | null; researches: ResearchOption[]; onClose: () => void; onSaved: () => void }) {
  const t = useTranslations("AcademicRepository.outputs");
  const common = useTranslations("AcademicRepository");
  const [saving, setSaving] = useState(false);
  const [values, setValues] = useState({ researchId: record?.researchId ?? "", kind: record?.kind ?? "ARTICLE" as ResearchOutputKind, reportingYear: String(record?.reportingYear ?? new Date().getFullYear()), title: record?.title ?? "", doi: record?.doi ?? "", journal: record?.journal ?? "", issn: record?.issn ?? "", isbn: record?.isbn ?? "", quartile: record?.quartile ?? "", fiveYearImpactFactor: record?.fiveYearImpactFactor ?? "", publicationDate: record?.publicationDate?.slice(0, 10) ?? "", publisher: record?.publisher ?? "", publicationPlace: record?.publicationPlace ?? "", indexation: record?.indexation ?? "", studentParticipation: record?.studentParticipation === null || record?.studentParticipation === undefined ? "" : String(record.studentParticipation), internationalParticipation: record?.internationalParticipation === null || record?.internationalParticipation === undefined ? "" : String(record.internationalParticipation), intellectualPropertyType: record?.intellectualPropertyType ?? "", phase: record?.phase ?? "", phaseDate: record?.phaseDate?.slice(0, 10) ?? "", notes: record?.notes ?? "" });
  const change = (key: keyof typeof values, value: string) => setValues((current) => ({ ...current, [key]: value }));
  const submit = async (event: FormEvent) => {
    event.preventDefault(); if (saving) return; setSaving(true);
    const payload = { ...values, reportingYear: Number(values.reportingYear), doi: values.doi || null, journal: values.journal || null, issn: values.issn || null, isbn: values.isbn || null, quartile: values.quartile || null, fiveYearImpactFactor: values.fiveYearImpactFactor || null, publicationDate: values.publicationDate || null, publisher: values.publisher || null, publicationPlace: values.publicationPlace || null, indexation: values.indexation || null, studentParticipation: values.studentParticipation === "" ? null : values.studentParticipation === "true", internationalParticipation: values.internationalParticipation === "" ? null : values.internationalParticipation === "true", intellectualPropertyType: values.intellectualPropertyType || null, phase: values.phase || null, phaseDate: values.phaseDate || null, notes: values.notes || null, ...(record ? { expectedUpdatedAt: record.updatedAt } : {}) };
    const operation = apiFetch(`/academic/research-outputs${record ? `/${record.id}` : ""}`, { method: record ? "PUT" : "POST", body: JSON.stringify(payload) });
    toast.promise(operation, { loading: t("saving"), success: t(record ? "updated" : "created"), error: (cause: unknown) => cause instanceof Error ? cause.message : t("saveError") });
    try { await operation; onSaved(); } catch { /* feedback via toast */ } finally { setSaving(false); }
  };
  const textField = (key: keyof typeof values, type = "text") => <label className="text-sm font-medium">{t(`fields.${key}`)}<input className={fieldClass} type={type} value={values[key]} required={["title", "reportingYear", "researchId"].includes(key)} onChange={(e) => change(key, e.target.value)} /></label>;
  return <Modal isOpen title={t(record ? "edit" : "create")} description={t("formHint")} size="4xl" onClose={() => !saving && onClose()} closeOnEscape={!saving} closeOnBackdropClick={!saving} closeLabel={common("close")}><form onSubmit={(e) => void submit(e)} className="space-y-4"><div className="grid gap-4 sm:grid-cols-2"><label className="text-sm font-medium">{t("fields.researchId")}<select className={fieldClass} required value={values.researchId} onChange={(e) => change("researchId", e.target.value)}><option value="">{t("chooseResearch")}</option>{researches.map((r) => <option key={r.id} value={r.id}>{r.code ? `${r.code} · ` : ""}{r.title}</option>)}</select></label><label className="text-sm font-medium">{t("fields.kind")}<select className={fieldClass} value={values.kind} onChange={(e) => change("kind", e.target.value)}>{kinds.map((k) => <option key={k} value={k}>{t(`kinds.${k}`)}</option>)}</select></label>{textField("title")}<label className="text-sm font-medium">{t("fields.reportingYear")}<input className={fieldClass} type="number" min="1900" max="2200" required value={values.reportingYear} onChange={(e) => change("reportingYear", e.target.value)} /></label>{textField("doi")} {textField("journal")} {textField("issn")} {textField("isbn")} {textField("quartile")} {textField("fiveYearImpactFactor", "number")} {textField("publicationDate", "date")} {textField("publisher")} {textField("publicationPlace")} {textField("indexation")}<label className="text-sm font-medium">{t("fields.studentParticipation")}<select className={fieldClass} value={values.studentParticipation} onChange={(e) => change("studentParticipation", e.target.value)}><option value="">{common("unknown")}</option><option value="true">{common("yes")}</option><option value="false">{common("no")}</option></select></label><label className="text-sm font-medium">{t("fields.internationalParticipation")}<select className={fieldClass} value={values.internationalParticipation} onChange={(e) => change("internationalParticipation", e.target.value)}><option value="">{common("unknown")}</option><option value="true">{common("yes")}</option><option value="false">{common("no")}</option></select></label>{textField("intellectualPropertyType")} {textField("phase")} {textField("phaseDate", "date")}<label className="text-sm font-medium sm:col-span-2">{t("fields.notes")}<textarea className={fieldClass} rows={3} value={values.notes} onChange={(e) => change("notes", e.target.value)} /></label></div>{record?.authors.length ? <p className="text-xs text-muted-foreground">{t("authorsPreserved", { count: record.authors.length })}</p> : null}<div className="flex justify-end gap-3 border-t border-border pt-4"><button type="button" className={secondaryButton} disabled={saving} onClick={onClose}>{common("cancel")}</button><button type="submit" className={primaryButton} disabled={saving}>{common(saving ? "saving" : "save")}</button></div></form></Modal>;
}

function OutputDetails({ row, onClose, onEdit }: { row: ResearchOutputRecord; onClose: () => void; onEdit: () => void }) {
  const t = useTranslations("AcademicRepository.outputs");
  const common = useTranslations("AcademicRepository");
  return <Modal isOpen title={row.title} eyebrow={t("title")} size="4xl" onClose={onClose} closeLabel={common("close")} footer={<button type="button" className={primaryButton} onClick={onEdit}>{common("edit")}</button>}><div className="space-y-5"><p className="text-sm"><strong>{t("research")}:</strong> {row.research?.title ?? t("unlinkedResearch")}</p><dl className="grid gap-4 sm:grid-cols-2">{([["kind", t(`kinds.${row.kind}`)], ["reportingYear", String(row.reportingYear)], ["doi", row.doi], ["journal", row.journal], ["issn", row.issn], ["isbn", row.isbn], ["quartile", row.quartile], ["fiveYearImpactFactor", row.fiveYearImpactFactor], ["publicationDate", row.publicationDate?.slice(0, 10)], ["publisher", row.publisher], ["publicationPlace", row.publicationPlace], ["indexation", row.indexation], ["studentParticipation", row.studentParticipation === null ? null : common(row.studentParticipation ? "yes" : "no")], ["internationalParticipation", row.internationalParticipation === null ? null : common(row.internationalParticipation ? "yes" : "no")], ["intellectualPropertyType", row.intellectualPropertyType], ["phase", row.phase], ["phaseDate", row.phaseDate?.slice(0, 10)], ["notes", row.notes]] as [string, string | null | undefined][]).map(([key, value]) => <div key={key}><dt className="text-xs text-muted-foreground">{t(`fields.${key}`)}</dt><dd className="mt-1 whitespace-pre-wrap text-sm">{value || common("unknown")}</dd></div>)}</dl><section><h2 className="mb-2 text-sm font-bold text-primary">{t("authors")}</h2>{row.authors.length ? <ol className="list-inside list-decimal space-y-1 text-sm">{row.authors.map((a) => <li key={a.id}>{a.name}{a.affiliation ? ` · ${a.affiliation}` : ""}</li>)}</ol> : <p className="text-sm text-muted-foreground">{t("noAuthors")}</p>}</section><section><h2 className="mb-2 text-sm font-bold text-primary">{t("projects")}</h2>{row.projects.length ? <ul className="list-inside list-disc text-sm">{row.projects.map(({ project }) => <li key={project.id}>{project.code ? `${project.code} · ` : ""}{project.title}</li>)}</ul> : <p className="text-sm text-muted-foreground">{t("noProjects")}</p>}</section></div></Modal>;
}
