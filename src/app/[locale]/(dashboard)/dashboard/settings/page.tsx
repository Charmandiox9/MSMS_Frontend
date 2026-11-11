"use client";

import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { CalendarDays, CheckCircle2, Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { useActiveRole } from "@/context/ActiveRoleContext";
import { apiFetch } from "@/lib/api";
import { CardsSkeleton, PageSkeleton } from "@/components/ui/LoadingSkeletons";

type Semester = {
  id: string;
  name: string;
  startsOn: string;
  endsOn: string;
  isActive: boolean;
};

export default function SettingsPage() {
  const t = useTranslations("SemesterSettingsPage");
  const { activeRole } = useActiveRole();
  const [semesters, setSemesters] = useState<Semester[]>([]);
  const [name, setName] = useState("");
  const [startsOn, setStartsOn] = useState("");
  const [endsOn, setEndsOn] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [reloadKey, setReloadKey] = useState(0);
  const canManage =
    activeRole === "SYSTEM_ADMIN" || activeRole === "ACADEMIC_SECRETARY";
  const loadErrorMessage = t("errors.load");

  // Carga al entrar y cada vez que `reloadKey` cambia (tras activar un semestre).
  useEffect(() => {
    if (!canManage) return;
    let active = true;
    apiFetch<Semester[]>("/academic/semesters")
      .then((data) => {
        if (active) {
          setSemesters(data);
          setError(null);
        }
      })
      .catch((cause: unknown) => {
        if (!active) return;
        const message =
          cause instanceof Error ? cause.message : loadErrorMessage;
        setError(message);
        toast.error(message);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [canManage, loadErrorMessage, reloadKey]);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaving(true);
    setError(null);

    try {
      await apiFetch<Semester>(
        editingId
          ? `/academic/semesters/${editingId}`
          : "/academic/semesters/activate",
        {
          method: editingId ? "PATCH" : "POST",
          body: JSON.stringify({ name, startsOn, endsOn }),
        },
      );
      toast.success(t(editingId ? "updated" : "success", { name }));
      setEditingId(null);
      setName("");
      setStartsOn("");
      setEndsOn("");
      setLoading(true);
      setReloadKey((key) => key + 1);
    } catch (cause) {
      const message = cause instanceof Error ? cause.message : t("errors.save");
      setError(message);
      toast.error(message);
    } finally {
      setSaving(false);
    }
  };

  if (activeRole === null) return <PageSkeleton />;
  if (activeRole !== "SYSTEM_ADMIN" && activeRole !== "ACADEMIC_SECRETARY")
    return (
      <div className="py-16 text-center text-sm text-muted-foreground">
        {t("errors.access")}
      </div>
    );

  return (
    <div className="max-w-5xl space-y-8">
      <header>
        <p className="text-xs font-black uppercase tracking-[0.18em] text-primary">
          {t("eyebrow")}
        </p>
        <h1 className="mt-2 text-3xl font-black tracking-tight text-foreground">
          {t("title")}
        </h1>
        <p className="mt-2 max-w-3xl text-sm text-muted-foreground">
          {t("subtitle")}
        </p>
      </header>
      {error && (
        <div
          role="alert"
          className="rounded-2xl border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive"
        >
          {error}
        </div>
      )}
      <section className="rounded-3xl border border-border bg-card p-5 shadow-sm md:p-6">
        <form
          aria-busy={saving}
          onSubmit={submit}
          className="grid gap-4 md:grid-cols-2"
        >
          <h2 className="text-lg font-bold text-foreground md:col-span-2">
            {t(editingId ? "edit" : "activate")}
          </h2>
          <label className="md:col-span-2">
            <span className="text-sm font-bold text-foreground">
              {t("name")}
            </span>
            <input
              required
              maxLength={100}
              disabled={saving || loading}
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder={t("namePlaceholder")}
              className="mt-2 h-11 w-full rounded-2xl border border-border bg-background px-3 text-sm text-foreground outline-none focus:border-primary"
            />
          </label>
          <label>
            <span className="text-sm font-bold text-foreground">
              {t("startsOn")}
            </span>
            <input
              required
              type="date"
              disabled={saving || loading}
              value={startsOn}
              onChange={(event) => setStartsOn(event.target.value)}
              className="mt-2 h-11 w-full rounded-2xl border border-border bg-background px-3 text-sm text-foreground outline-none focus:border-primary"
            />
          </label>
          <label>
            <span className="text-sm font-bold text-foreground">
              {t("endsOn")}
            </span>
            <input
              required
              type="date"
              disabled={saving || loading}
              value={endsOn}
              onChange={(event) => setEndsOn(event.target.value)}
              className="mt-2 h-11 w-full rounded-2xl border border-border bg-background px-3 text-sm text-foreground outline-none focus:border-primary"
            />
          </label>
          <div className="flex flex-wrap gap-3 md:col-span-2">
            {editingId && (
              <button
                type="button"
                disabled={saving}
                onClick={() => {
                  setEditingId(null);
                  setName("");
                  setStartsOn("");
                  setEndsOn("");
                }}
                className="min-h-11 rounded-xl border border-border px-4 text-sm font-semibold focus-visible:ring-2 focus-visible:ring-primary"
              >
                {t("cancel")}
              </button>
            )}
            <button
              type="submit"
              disabled={saving || loading}
              className="inline-flex items-center gap-2 rounded-2xl bg-primary px-4 py-2.5 text-sm font-bold text-primary-foreground disabled:opacity-60"
            >
              {saving ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <CheckCircle2 className="h-4 w-4" />
              )}
              {saving ? t("saving") : t(editingId ? "saveChanges" : "activate")}
            </button>
          </div>
        </form>
      </section>
      <section className="rounded-3xl border border-border bg-card p-5 shadow-sm md:p-6">
        <div className="flex items-center gap-3">
          <CalendarDays className="h-5 w-5 text-primary" />
          <h2 className="text-lg font-black text-foreground">{t("history")}</h2>
        </div>
        {loading ? (
          <CardsSkeleton count={4} grid className="mt-5" />
        ) : semesters.length === 0 ? (
          <p className="mt-5 text-sm text-muted-foreground">{t("empty")}</p>
        ) : (
          <div className="mt-5 grid gap-3 md:grid-cols-2">
            {semesters.map((semester) => (
              <div
                key={semester.id}
                className={`rounded-2xl border p-4 ${semester.isActive ? "border-primary/40 bg-primary/5" : "border-border"}`}
              >
                <div className="flex items-center justify-between gap-3">
                  <p className="font-bold text-foreground">{semester.name}</p>
                  <span
                    className={`rounded-full px-2.5 py-1 text-[10px] font-black uppercase tracking-wide ${semester.isActive ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"}`}
                  >
                    {semester.isActive ? t("active") : t("inactive")}
                  </span>
                </div>
                {semester.isActive && (
                  <button
                    type="button"
                    disabled={saving || loading}
                    onClick={() => {
                      setEditingId(semester.id);
                      setName(semester.name);
                      setStartsOn(semester.startsOn.slice(0, 10));
                      setEndsOn(semester.endsOn.slice(0, 10));
                    }}
                    className="mt-3 min-h-11 rounded-xl border border-border px-3 text-sm font-semibold text-primary focus-visible:ring-2 focus-visible:ring-primary"
                  >
                    {t("edit")}
                  </button>
                )}
                <p className="mt-2 text-xs text-muted-foreground">
                  {semester.startsOn.slice(0, 10)} —{" "}
                  {semester.endsOn.slice(0, 10)}
                </p>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
