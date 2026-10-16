"use client";

import { useEffect, useState, type ReactNode } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { ArrowRight, ShieldCheck } from "lucide-react";
import { getActiveSession } from "@/lib/auth";
import { ACTIVE_ROLE_STORAGE_KEY, getSessionRoles } from "@/lib/active-role";
import type { ActiveSession, UserRoleCode } from "@/types/auth";
import LoginPreferences from "@/components/auth/LoginPreferences";

export default function SessionEntry({ children }: { children: ReactNode }) {
  const locale = useLocale();
  const router = useRouter();
  const t = useTranslations("SessionEntry");
  const tRoles = useTranslations("DashboardNav.roles");
  const [session, setSession] = useState<ActiveSession | null | undefined>(
    undefined,
  );
  const [selected, setSelected] = useState<UserRoleCode | null>(null);
  const [entering, setEntering] = useState(false);

  useEffect(() => {
    let active = true;
    void getActiveSession().then((value) => {
      if (!active) return;
      setSession(value);
      if (!value) return;
      const roles = getSessionRoles(value);
      if (!roles.length) router.replace(`/${locale}/no-access`);
      else if (roles.length === 1) {
        localStorage.setItem(ACTIVE_ROLE_STORAGE_KEY, roles[0]);
        router.replace(`/${locale}/dashboard`);
      }
    });
    return () => {
      active = false;
    };
  }, [locale, router]);

  if (session === null) return children;
  const roles = session ? getSessionRoles(session) : [];
  if (!session || roles.length < 2 || entering)
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-6">
        <p role="status" className="text-sm font-medium text-muted-foreground">
          {t(entering ? "entering" : "checking")}
        </p>
      </div>
    );

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-5 py-16">
      <LoginPreferences />
      <section className="w-full max-w-lg rounded-3xl border border-border bg-card p-6 text-card-foreground shadow-sm sm:p-8">
        <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
          <ShieldCheck aria-hidden className="h-6 w-6" />
        </div>
        <p className="text-xs font-bold uppercase tracking-widest text-primary">
          MARSYS
        </p>
        <h1 className="mt-2 text-2xl font-black tracking-tight text-foreground">
          {t("title")}
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">{t("description")}</p>
        <p className="mt-3 break-all text-xs font-medium text-muted-foreground">
          {session.email}
        </p>
        <form
          className="mt-6 space-y-5"
          onSubmit={(event) => {
            event.preventDefault();
            if (!selected || !roles.includes(selected)) return;
            localStorage.setItem(ACTIVE_ROLE_STORAGE_KEY, selected);
            setEntering(true);
            router.replace(`/${locale}/dashboard`);
          }}
        >
          <fieldset className="space-y-3">
            <legend className="mb-3 text-sm font-semibold">
              {t("roleLabel")}
            </legend>
            {roles.map((role) => (
              <label
                key={role}
                className="flex cursor-pointer items-center gap-3 rounded-xl border border-border px-4 py-4 transition hover:bg-muted/40 has-checked:border-primary has-checked:bg-primary/5"
              >
                <input
                  type="radio"
                  name="entry-role"
                  value={role}
                  checked={selected === role}
                  onChange={() => setSelected(role)}
                  className="h-4 w-4 shrink-0 accent-primary focus-visible:ring-2 focus-visible:ring-primary"
                />
                <span className="text-sm font-semibold text-foreground">
                  {tRoles(role)}
                </span>
              </label>
            ))}
          </fieldset>
          <button
            type="submit"
            disabled={!selected}
            className="flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 text-sm font-bold text-primary-foreground hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:cursor-not-allowed disabled:opacity-50"
          >
            {t("continue")}
            <ArrowRight aria-hidden className="h-4 w-4" />
          </button>
        </form>
      </section>
    </main>
  );
}
