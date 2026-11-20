"use client";

import { useState, type FormEvent } from "react";
import { useMutation, useQuery } from "@apollo/client/react";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { useFormatter, useLocale, useTranslations } from "next-intl";
import { toast } from "sonner";
import Modal from "@/components/ui/Modal";
import { buttonClass, inputClass, primaryClass } from "./controls";
import { DELETE_TARIFF, SAVE_TARIFF, TARIFFS } from "../graphql";
import type { AssistantshipTariffOption } from "../schema-types";

export default function AssistantshipTariffsDialog({
  semesterId,
  semesterName,
  onClose,
}: {
  semesterId: string;
  semesterName: string;
  onClose: () => void;
}) {
  const t = useTranslations("AssistantshipsPage.tariffs");
  const format = useFormatter();
  const locale = useLocale();
  const [name, setName] = useState("");
  const [monthlyRateClp, setMonthlyRateClp] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const { data, loading, error, refetch } = useQuery(TARIFFS, {
    variables: { semesterId },
    fetchPolicy: "network-only",
  });
  const [saveTariff, { loading: saving }] = useMutation(SAVE_TARIFF);
  const [deleteTariff] = useMutation(DELETE_TARIFF);
  const displayRate = (value: number) => new Intl.NumberFormat(locale === "es" ? "es-CL" : "en-US", { maximumFractionDigits: 0 }).format(value);
  const parseRate = (value: string) => Number(value.replace(/\D/g, "") || 0);

  const reset = () => {
    setEditingId(null);
    setName("");
    setMonthlyRateClp("");
  };

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const parsedRate = parseRate(monthlyRateClp);
    if (parsedRate < 1 || parsedRate > 1_000_000_000) {
      toast.error(t("rateRequired"));
      return;
    }
    const operation = saveTariff({
      variables: {
        input: {
          ...(editingId ? { id: editingId } : {}),
          semesterId,
          name: name.trim(),
          monthlyRateClp: parsedRate,
        },
      },
    });
    try {
      await toast.promise(operation, {
        loading: t("saving"),
        success: t(editingId ? "updated" : "created"),
        error: t("saveError"),
      });
      await refetch();
      reset();
    } catch {
      // The toast communicates the mutation error and keeps the form open.
    }
  };

  const remove = async (tariff: AssistantshipTariffOption) => {
    const operation = deleteTariff({ variables: { id: tariff.id } });
    try {
      await toast.promise(operation, {
        loading: t("deleting"),
        success: t("deleted"),
        error: t("deleteError"),
      });
      await refetch();
      if (editingId === tariff.id) reset();
    } catch {
      // Assigned rates are protected by the backend and cannot be deleted.
    }
  };

  return (
    <Modal
      isOpen
      onClose={onClose}
      size="2xl"
      title={t("title")}
      description={t("description", { semester: semesterName })}
      closeLabel={t("close")}
      footer={<button type="button" className={buttonClass} onClick={onClose}>{t("close")}</button>}
    >
      <div className="max-h-[65vh] space-y-5 overflow-y-auto pr-1">
        <form onSubmit={(event) => void submit(event)} className="grid gap-3 rounded-2xl border border-border bg-muted/20 p-4 sm:grid-cols-[1fr_12rem_auto] sm:items-end">
          <label className="text-sm font-semibold">{t("name")}<input className={inputClass} value={name} onChange={(event) => setName(event.target.value)} maxLength={80} required /></label>
          <label className="text-sm font-semibold">{t("monthlyRate")}<input className={inputClass} type="text" inputMode="numeric" autoComplete="off" value={monthlyRateClp ? displayRate(parseRate(monthlyRateClp)) : ""} onChange={(event) => setMonthlyRateClp(event.target.value.replace(/\D/g, ""))} aria-describedby="assistantship-tariff-basis" required /></label>
          <button className={primaryClass} type="submit" disabled={saving || loading}>{editingId ? <Pencil size={16}/> : <Plus size={16}/>} {editingId ? t("update") : t("add")}</button>
          {editingId && <button type="button" className="text-sm font-semibold text-muted-foreground sm:col-span-3 sm:justify-self-end" onClick={reset}>{t("cancelEdit")}</button>}
          <p id="assistantship-tariff-basis" className="text-xs text-muted-foreground sm:col-span-3">{t("basis")}</p>
          <p className="text-xs text-muted-foreground sm:col-span-3">{t("snapshotNote")}</p>
        </form>

        {loading ? <p role="status" className="py-4 text-sm text-muted-foreground">{t("loading")}</p> : null}
        {error ? <p role="alert" className="text-sm text-destructive">{t("loadError")}</p> : null}
        {!loading && !data?.assistantshipTariffs.length ? <p role="status" className="rounded-xl bg-muted p-4 text-sm text-muted-foreground">{t("empty")}</p> : null}
        <ul className="space-y-2">
          {data?.assistantshipTariffs.map((tariff) => (
            <li key={tariff.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border p-3">
              <div><p className="font-semibold text-foreground">{tariff.name}</p><p className="text-xs text-muted-foreground">{format.number(tariff.monthlyRateClp, { style: "currency", currency: "CLP", maximumFractionDigits: 0 })} {t("perWeeklyHourMonth")}</p></div>
              <div className="flex gap-2"><button type="button" className={buttonClass} onClick={() => { setEditingId(tariff.id); setName(tariff.name); setMonthlyRateClp(String(tariff.monthlyRateClp)); }}>{t("edit")}</button><button type="button" aria-label={t("deleteNamed", { name: tariff.name })} className="rounded-xl p-2 text-destructive hover:bg-destructive/10" onClick={() => void remove(tariff)}><Trash2 size={17}/></button></div>
            </li>
          ))}
        </ul>
      </div>
    </Modal>
  );
}
