"use client";

import { useEffect, useMemo, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { toast } from "sonner";
import Modal from "@/components/ui/Modal";
import { apiFetch } from "@/lib/api";

type RoleOption = { code: string; name: string };
type Allocation = { code?: "HOURLY_TEACHERS" | "ASSISTANTSHIPS" | null; name: string; amountClp: number };
type Threshold = { percentage: number; roleCodes: string[] };
type BudgetData = {
  totalAmountClp: number;
  allocations: Allocation[];
  thresholds: Threshold[];
  roleOptions: RoleOption[];
};

type Props = { semesterId: string; semesterName: string; onClose: () => void };
const field = "mt-1 h-10 w-full rounded-xl border border-border bg-background px-3 text-sm text-foreground";
const MAX_CLP = 1_000_000_000_000;

function parseClp(value: string): number {
  const digits = value.replace(/\D/g, "");
  return digits ? Number(digits) : 0;
}

function formatClp(value: number, locale: string): string {
  return new Intl.NumberFormat(locale === "es" ? "es-CL" : "en-US", { maximumFractionDigits: 0 }).format(value);
}

export default function SemesterBudgetDialog({ semesterId, semesterName, onClose }: Props) {
  const t = useTranslations("SemesterBudgetDialog");
  const locale = useLocale();
  const [budget, setBudget] = useState<BudgetData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    apiFetch<BudgetData>(`/academic/semesters/${semesterId}/budget`).then((data) => {
      if (!active) return;
      setBudget({
        ...data,
        allocations: data.allocations.length ? data.allocations : [
          { code: "HOURLY_TEACHERS", name: t("defaultTeacher"), amountClp: 0 },
          { code: "ASSISTANTSHIPS", name: t("defaultAssistantship"), amountClp: 0 },
        ],
        thresholds: data.thresholds.length ? data.thresholds : [
          { percentage: 80, roleCodes: [] },
          { percentage: 100, roleCodes: [] },
        ],
      });
    }).catch((cause: unknown) => {
      setError(cause instanceof Error ? cause.message : t("loadError"));
    }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [semesterId, t]);

  const allocated = useMemo(() => budget?.allocations.reduce((sum, item) => sum + (Number(item.amountClp) || 0), 0) ?? 0, [budget]);
  const currency = useMemo(() => new Intl.NumberFormat(locale === "es" ? "es-CL" : "en-US", { style: "currency", currency: "CLP", maximumFractionDigits: 0 }), [locale]);
  const updateAllocation = (index: number, changes: Partial<Allocation>) => setBudget((current) => current ? ({ ...current, allocations: current.allocations.map((item, i) => i === index ? { ...item, ...changes } : item) }) : current);
  const updateThreshold = (index: number, changes: Partial<Threshold>) => setBudget((current) => current ? ({ ...current, thresholds: current.thresholds.map((item, i) => i === index ? { ...item, ...changes } : item) }) : current);

  const save = async () => {
    if (!budget) return;
    if (Number(budget.totalAmountClp) < 1 || Number(budget.totalAmountClp) > MAX_CLP) {
      setError(t("totalError"));
      return;
    }
    if (budget.allocations.some((item) => !item.name.trim() || Number(item.amountClp) < 0 || Number(item.amountClp) > MAX_CLP)) {
      setError(t("categoryError"));
      return;
    }
    if (budget.thresholds.some((item) => Number(item.percentage) < 1 || Number(item.percentage) > 100 || new Set(budget.thresholds.map((threshold) => Number(threshold.percentage))).size !== budget.thresholds.length)) {
      setError(t("thresholdError"));
      return;
    }
    if (allocated > Number(budget.totalAmountClp)) {
      setError(t("allocationError"));
      return;
    }
    setSaving(true);
    setError("");
    const payload = {
      totalAmountClp: Number(budget.totalAmountClp),
      allocations: budget.allocations.map(({ code, name, amountClp }) => ({ code, name: name.trim(), amountClp: Number(amountClp) })),
      thresholds: budget.thresholds.map(({ percentage, roleCodes }) => ({ percentage: Number(percentage), roleCodes })),
    };
    const operation = apiFetch<BudgetData>(`/academic/semesters/${semesterId}/budget`, {
      method: "PUT",
      body: JSON.stringify(payload),
    }).then((updated) => { setBudget(updated); onClose(); });
    try {
      await toast.promise(operation, { loading: t("saving"), success: t("saved"), error: (cause) => cause instanceof Error ? cause.message : t("saveError") });
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : t("saveError"));
    } finally { setSaving(false); }
  };

  return <Modal isOpen onClose={onClose} size="4xl" closeLabel={t("close")} title={t("title")} description={t("description", { semester: semesterName })}
    footer={<><button type="button" onClick={onClose} className="min-h-10 rounded-xl border border-border px-4 text-sm font-semibold">{t("cancel")}</button><button type="button" disabled={loading || saving || !budget} onClick={save} className="min-h-10 rounded-xl bg-primary px-4 text-sm font-bold text-primary-foreground disabled:opacity-50">{saving ? t("saving") : t("save")}</button></>}>
    {loading ? <p className="py-8 text-sm text-muted-foreground">{t("loading")}</p> : error && !budget ? <p role="alert" className="text-sm text-destructive">{error}</p> : budget && <div className="max-h-[65vh] space-y-6 overflow-y-auto pr-1">
      {error && <p role="alert" className="rounded-xl bg-destructive/10 p-3 text-sm text-destructive">{error}</p>}
      <label className="block text-sm font-semibold">{t("total")}<input className={field} type="text" inputMode="numeric" autoComplete="off" value={formatClp(Number(budget.totalAmountClp) || 0, locale)} onChange={(e) => setBudget({ ...budget, totalAmountClp: Math.min(parseClp(e.target.value), MAX_CLP) })} /></label>
      <section className="space-y-3"><div className="flex items-center justify-between"><h3 className="font-bold">{t("allocations")}</h3><span className="text-xs text-muted-foreground">{t("allocated", { amount: currency.format(allocated), remaining: currency.format(Number(budget.totalAmountClp) - allocated) })}</span></div>
        {budget.allocations.map((item, index) => <div key={index} className="grid gap-2 sm:grid-cols-[1fr_12rem_auto]"><label className="text-xs font-semibold">{t("category")}<input className={field} maxLength={80} value={item.name} onChange={(e) => updateAllocation(index, { name: e.target.value })} /></label><label className="text-xs font-semibold">{t("amount")}<input className={field} type="text" inputMode="numeric" autoComplete="off" value={formatClp(Number(item.amountClp) || 0, locale)} onChange={(e) => updateAllocation(index, { amountClp: Math.min(parseClp(e.target.value), MAX_CLP) })} /></label><button type="button" aria-label={t("removeCategory")} onClick={() => setBudget({ ...budget, allocations: budget.allocations.filter((_, i) => i !== index) })} className="mt-5 rounded-lg p-2 text-destructive"><Trash2 size={18}/></button></div>)}
        <button type="button" onClick={() => setBudget({ ...budget, allocations: [...budget.allocations, { name: "", amountClp: 0 }] })} className="inline-flex items-center gap-2 text-sm font-semibold text-primary"><Plus size={16}/>{t("addCategory")}</button>
      </section>
      <section className="space-y-3"><div className="flex items-center justify-between"><div><h3 className="font-bold">{t("thresholds")}</h3><p className="text-xs text-muted-foreground">{t("thresholdHint")}</p></div></div>
        {budget.thresholds.map((item, index) => <fieldset key={index} className="rounded-xl border border-border p-3"><legend className="px-1 text-sm font-semibold">{t("threshold", { number: index + 1 })}</legend><div className="grid gap-3 md:grid-cols-[8rem_1fr]"><label className="text-xs font-semibold">{t("percentage")}<input className={field} type="number" min="1" max="100" value={item.percentage} onChange={(e) => updateThreshold(index, { percentage: Number(e.target.value) })}/></label><div><p className="text-xs font-semibold">{t("recipientRoles")}</p><div className="mt-2 flex flex-wrap gap-x-4 gap-y-2">{budget.roleOptions.map((role) => <label key={role.code} className="inline-flex items-center gap-2 text-xs"><input type="checkbox" checked={item.roleCodes.includes(role.code)} onChange={(e) => updateThreshold(index, { roleCodes: e.target.checked ? [...item.roleCodes, role.code] : item.roleCodes.filter((code) => code !== role.code) })}/>{role.name}</label>)}</div></div><button type="button" aria-label={t("removeThreshold")} onClick={() => setBudget({ ...budget, thresholds: budget.thresholds.filter((_, i) => i !== index) })} className="justify-self-start text-xs font-semibold text-destructive">{t("remove")}</button></div></fieldset>)}
        <button type="button" onClick={() => setBudget({ ...budget, thresholds: [...budget.thresholds, { percentage: 90, roleCodes: [] }] })} className="inline-flex items-center gap-2 text-sm font-semibold text-primary"><Plus size={16}/>{t("addThreshold")}</button>
      </section>
    </div>}
  </Modal>;
}
