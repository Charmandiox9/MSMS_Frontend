"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/routing";
import { useSearchParams } from "next/navigation";
import DashboardSidebar from "@/components/dashboard/DashboardSidebar";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import { ActiveRoleProvider, useActiveRole } from "@/context/ActiveRoleContext";
import { ACTIVE_ROLE_STORAGE_KEY, getSessionRoles } from "@/lib/active-role";
import { getActiveSession, logout, type ActiveSession } from "@/lib/auth";
import { DashboardShellSkeleton } from "@/components/ui/LoadingSkeletons";
import TermsAcceptanceGate from "@/components/legal/TermsAcceptanceGate";
import WelcomeLoadingScreen from "@/components/auth/WelcomeLoadingScreen";
import { DashboardStartupProvider } from "@/context/DashboardStartupContext";
import type { UserRoleCode } from "@/types/auth";

const DESKTOP_BREAKPOINT = "(min-width: 48rem)";

function DashboardLayoutContent({ children }: { children: React.ReactNode }) {
  const t = useTranslations("DashboardNav");
  const [mobileOpen, setMobileOpen] = useState(false);
  const { activeRole, session } = useActiveRole();
  const mobileDialogId = useId();
  const mobileDialogRef = useRef<HTMLDialogElement>(null);
  const menuTriggerRef = useRef<HTMLButtonElement>(null);

  function openMobileMenu() {
    const dialog = mobileDialogRef.current;
    if (!dialog || dialog.open || window.matchMedia(DESKTOP_BREAKPOINT).matches) return;

    dialog.showModal();
    setMobileOpen(true);
  }

  function requestMobileClose() {
    mobileDialogRef.current?.close();
  }

  function handleMobileClosed() {
    setMobileOpen(false);
    if (!window.matchMedia(DESKTOP_BREAKPOINT).matches) {
      menuTriggerRef.current?.focus({ preventScroll: true });
    }
  }

  useEffect(() => {
    if (!mobileOpen) return;

    const rootStyle = document.documentElement.style;
    const previousOverflow = rootStyle.overflow;
    const desktop = window.matchMedia(DESKTOP_BREAKPOINT);
    const closeAtDesktop = (event: MediaQueryListEvent) => {
      if (event.matches) mobileDialogRef.current?.close();
    };
    rootStyle.overflow = "hidden";
    desktop.addEventListener("change", closeAtDesktop);

    return () => {
      rootStyle.overflow = previousOverflow;
      desktop.removeEventListener("change", closeAtDesktop);
    };
  }, [mobileOpen]);

  return (
    <div className="institutional-theme dashboard-workspace flex min-h-screen bg-background text-foreground">
      <a
        href="#dashboard-main"
        className="sr-only focus:not-sr-only focus:fixed focus:start-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-card focus:px-4 focus:py-3 focus:text-primary focus:ring-2 focus:ring-focus"
      >
        {t("skipToContent")}
      </a>
      <DashboardSidebar
        activeRole={activeRole}
        session={session}
        mobileOpen={mobileOpen}
        mobileDialogId={mobileDialogId}
        mobileDialogRef={mobileDialogRef}
        onMobileCloseRequest={requestMobileClose}
        onMobileClosed={handleMobileClosed}
      />
      <div className="flex min-w-0 flex-1 flex-col">
        <DashboardHeader
          activeRole={activeRole}
          mobileOpen={mobileOpen}
          mobileDialogId={mobileDialogId}
          menuTriggerRef={menuTriggerRef}
          onMenuOpen={openMobileMenu}
        />
        <main id="dashboard-main" tabIndex={-1} className="flex-1 scroll-mt-16 p-4 md:p-8">
          <div className="mx-auto max-w-7xl">{children}</div>
        </main>
      </div>
    </div>
  );
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const t = useTranslations("Dashboard");
  const router = useRouter();
  const searchParams = useSearchParams();
  const [session, setSession] = useState<ActiveSession | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadingRole, setLoadingRole] = useState<UserRoleCode | null>(null);
  const welcomeRequested = searchParams?.get("welcome") === "1";
  const [termsAccepted, setTermsAccepted] = useState<boolean | null>(null);

  const handleTermsAccessResolved = useCallback((accepted: boolean) => {
    setTermsAccepted(accepted);
  }, []);

  const handleWelcomeComplete = useCallback(() => {
    setTermsAccepted(null);
    router.replace("/dashboard", { scroll: false });
  }, [router]);

  useEffect(() => {
    let mounted = true;

    void getActiveSession().then(async (activeSession) => {
      if (!mounted) return;

      setSession(activeSession);

      if (!activeSession) {
        setIsLoading(false);
        // Una cookie vencida, inválida o de una cuenta desactivada sigue en el navegador:
        // el middleware la vería y devolvería /login → /dashboard. El logout del backend
        // es público y la borra aunque la sesión ya no sea válida.
        await logout().catch(() => undefined);
        if (mounted) router.replace("/login");
        return;
      }

      const roles = getSessionRoles(activeSession);
      const savedRole = localStorage.getItem(ACTIVE_ROLE_STORAGE_KEY);
      setLoadingRole(roles.find((role) => role === savedRole) ?? roles[0] ?? null);
      setIsLoading(false);
    });

    return () => {
      mounted = false;
    };
  }, [router]);

  if (isLoading && welcomeRequested) {
    return (
      <WelcomeLoadingScreen
        phase="checking"
      />
    );
  }

  if (isLoading || !session) {
    return (
      <div className="institutional-theme dashboard-workspace min-h-screen bg-background text-foreground">
        <DashboardShellSkeleton label={t("sessionChecking")} />
      </div>
    );
  }

  return (
    <ActiveRoleProvider initialSession={session}>
      <DashboardStartupProvider
        activeRole={loadingRole}
        displayName={session.displayName}
        enabled={welcomeRequested && termsAccepted !== false}
        onComplete={handleWelcomeComplete}
      >
        <TermsAcceptanceGate onAccessResolved={handleTermsAccessResolved}>
          <DashboardLayoutContent>{children}</DashboardLayoutContent>
        </TermsAcceptanceGate>
      </DashboardStartupProvider>
    </ActiveRoleProvider>
  );
}
