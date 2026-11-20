"use client";

import { useEffect, useState, type ReactNode } from "react";
import { useTranslations } from "next-intl";
import { ArrowRight, ShieldCheck } from "lucide-react";
import { useRouter } from "@/i18n/routing";
import { getActiveSession } from "@/lib/auth";
import { ACTIVE_ROLE_STORAGE_KEY, getSessionRoles } from "@/lib/active-role";
import type { ActiveSession, UserRoleCode } from "@/types/auth";
import LoginPreferences from "@/components/auth/LoginPreferences";
import RoleSelectionList from "@/components/auth/RoleSelectionList";
import WelcomeLoadingScreen from "@/components/auth/WelcomeLoadingScreen";

export default function SessionEntry({ children }: { children: ReactNode }) {
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
      if (!roles.length) router.replace("/no-access");
      else if (roles.length === 1) {
        localStorage.setItem(ACTIVE_ROLE_STORAGE_KEY, roles[0]);
        setSelected(roles[0]);
        setEntering(true);
        router.replace("/dashboard?welcome=1");
      }
    });
    return () => {
      active = false;
    };
  }, [router]);

  if (!session) return children;
  const roles = getSessionRoles(session);
  if (!roles.length)
    return (
      <WelcomeLoadingScreen
        phase="checking"
        displayName={session.displayName}
      />
    );
  if (entering)
    return (
      <WelcomeLoadingScreen
        phase="preparing"
        displayName={session?.displayName}
        activeRole={selected ?? roles[0] ?? null}
      />
    );
  if (roles.length < 2) return children;

  return (
    <main className="institutional-theme flex min-h-screen items-center justify-center bg-background px-5 py-16">
      <LoginPreferences variant="institutional" />
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
            router.replace("/dashboard?welcome=1");
          }}
        >
          <RoleSelectionList
            roles={roles}
            selectedRole={selected}
            onSelect={setSelected}
            legend={t("roleLabel")}
            roleName={tRoles}
          />
          <button
            type="submit"
            disabled={!selected}
            className="flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 text-sm font-bold text-primary-foreground hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus disabled:cursor-not-allowed disabled:opacity-50"
          >
            {t("continue")}
            <ArrowRight aria-hidden className="h-4 w-4" />
          </button>
        </form>
      </section>
    </main>
  );
}
