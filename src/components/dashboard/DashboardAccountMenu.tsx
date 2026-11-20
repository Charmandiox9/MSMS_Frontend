"use client";

import {
  ArrowLeft,
  ChevronRight,
  ChevronsUpDown,
  LogOut,
  Moon,
  Sun,
  UserRound,
} from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useTheme } from "next-themes";
import { useEffect, useId, useRef, useState, type KeyboardEvent } from "react";
import { toast } from "sonner";
import { DASHBOARD_SECTIONS, isRouteAllowed } from "@/config/navigation";
import { useActiveRole } from "@/context/ActiveRoleContext";
import { useMounted } from "@/hooks/useMounted";
import { Link, LOCALE_COOKIE_NAME, routing, usePathname, useRouter } from "@/i18n/routing";
import { logout, type ActiveSession } from "@/lib/auth";
import { APP_BASE_PATH } from "@/lib/base-path";
import type { UserRoleCode } from "@/types/auth";
import RoleSelectionList from "@/components/auth/RoleSelectionList";

const FOCUS_STYLE = "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-inset";
const ROW_STYLE = `flex min-h-11 w-full items-center gap-3 rounded-lg px-2 py-2 text-left text-sm font-medium ${FOCUS_STYLE}`;
const INTERACTIVE_ROW_STYLE = `${ROW_STYLE} text-foreground hover:bg-muted`;
const LOCALE_LABELS = { es: "spanish", en: "english" } as const;
const ACCOUNT_ROUTES = DASHBOARD_SECTIONS.flatMap(({ items }) => items.map(({ href }) => href))
  .sort((first, second) => second.length - first.length);

type AccountView = "account" | "roles" | null;
type AccountLocale = (typeof routing.locales)[number];

function roleCanKeepView(pathname: string, role: UserRoleCode) {
  const route = ACCOUNT_ROUTES.find((href) => pathname === href || pathname.startsWith(`${href}/`));
  return isRouteAllowed(route ?? pathname, DASHBOARD_SECTIONS, role);
}

function persistLocalePreference(locale: AccountLocale) {
  document.cookie = `${LOCALE_COOKIE_NAME}=${locale}; path=${APP_BASE_PATH || "/"}; SameSite=Lax`;
}

function AccountPreferences() {
  const t = useTranslations("DashboardNav");
  const locale = useLocale();
  const router = useRouter();
  const { resolvedTheme, setTheme } = useTheme();
  const mounted = useMounted();
  const languageId = useId();
  const isDark = mounted && resolvedTheme === "dark";

  function changeLocale(nextLocale: AccountLocale) {
    if (nextLocale === locale) return;

    persistLocalePreference(nextLocale);
    router.refresh();
  }

  return (
    <>
      <label className={`${INTERACTIVE_ROW_STYLE} cursor-pointer justify-between`}>
        <span>{t("darkModeLabel")}</span>
        <input
          type="checkbox"
          role="switch"
          className="peer sr-only"
          checked={isDark}
          disabled={!mounted}
          onChange={(event) => setTheme(event.currentTarget.checked ? "dark" : "light")}
        />
        <span className="flex shrink-0 items-center gap-1 rounded-full border border-control bg-muted p-1 peer-focus-visible:ring-2 peer-focus-visible:ring-focus" aria-hidden="true">
          <Sun className={`size-6 rounded-full p-1 ${isDark ? "text-muted-foreground" : "bg-primary text-primary-foreground"}`} />
          <Moon className={`size-6 rounded-full p-1 ${isDark ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`} />
        </span>
      </label>
      <div className="flex min-h-11 flex-wrap items-center justify-between gap-x-2 px-2 text-sm font-medium">
        <span id={languageId}>{t("language")}</span>
        <div role="radiogroup" aria-labelledby={languageId} className="flex flex-wrap items-center gap-1">
          {routing.locales.map((option) => (
            <label key={option} className="relative cursor-pointer">
              <input
                type="radio"
                name={languageId}
                value={option}
                className="peer sr-only"
                checked={option === locale}
                onChange={() => changeLocale(option)}
              />
              <span lang={option} className="flex min-h-11 items-center rounded-lg px-2 text-muted-foreground hover:bg-muted peer-checked:bg-selection peer-checked:font-semibold peer-checked:text-foreground peer-checked:underline peer-checked:underline-offset-4 peer-focus-visible:ring-2 peer-focus-visible:ring-focus">
                {t(LOCALE_LABELS[option])}
              </span>
            </label>
          ))}
        </div>
      </div>
    </>
  );
}

export default function DashboardAccountMenu({
  session,
  onNavigate,
}: {
  session: ActiveSession | null;
  onNavigate?: () => void;
}) {
  const t = useTranslations("DashboardNav");
  const pathname = usePathname();
  const router = useRouter();
  const { activeRole, roles, hasMultipleRoles, setActiveRole } = useActiveRole();
  const [view, setView] = useState<AccountView>(null);
  const [signingOut, setSigningOut] = useState(false);
  const panelId = useId();
  const accountLabelId = useId();
  const roleLabelId = useId();
  const containerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLElement>(null);
  const profileRef = useRef<HTMLAnchorElement>(null);
  const roleButtonRef = useRef<HTMLButtonElement>(null);
  const backRef = useRef<HTMLButtonElement>(null);
  const focusRoleButton = useRef(false);

  useEffect(() => {
    if (!view) return;

    if (panelRef.current) panelRef.current.scrollTop = 0;

    if (view === "roles") {
      backRef.current?.focus();
    } else if (focusRoleButton.current) {
      focusRoleButton.current = false;
      roleButtonRef.current?.focus();
    } else {
      profileRef.current?.focus();
    }

    function dismissOnOutsidePointer(event: PointerEvent) {
      if (event.target instanceof Node && !containerRef.current?.contains(event.target)) {
        setView(null);
      }
    }

    document.addEventListener("pointerdown", dismissOnOutsidePointer);
    return () => document.removeEventListener("pointerdown", dismissOnOutsidePointer);
  }, [view]);

  function backToAccount() {
    focusRoleButton.current = true;
    setView("account");
  }

  function closePanel() {
    setView(null);
    triggerRef.current?.focus();
  }

  function handleEscape(event: KeyboardEvent<HTMLDivElement>) {
    if (!view || event.key !== "Escape") return;

    event.preventDefault();
    event.stopPropagation();
    if (view === "roles") backToAccount();
    else closePanel();
  }

  function navigateFromPanel() {
    closePanel();
    onNavigate?.();
  }

  function changeRole(role: UserRoleCode) {
    if (role === activeRole) {
      backToAccount();
      return;
    }

    setActiveRole(role);
    const roleName = t(`roles.${role}`);

    if (roleCanKeepView(pathname, role)) {
      backToAccount();
      toast.success(t("roleChangeSuccess", { role: roleName }));
    } else {
      navigateFromPanel();
      router.replace("/dashboard");
      toast.info(t("roleChangeRedirect", { role: roleName }));
    }
  }

  async function signOut() {
    if (signingOut) return;
    setSigningOut(true);

    try {
      await logout();
      navigateFromPanel();
      router.replace("/");
      router.refresh();
    } catch {
      toast.error(t("signOutError"));
    } finally {
      setSigningOut(false);
    }
  }

  return (
    <div
      ref={containerRef}
      className="relative px-3 py-2"
      onKeyDown={handleEscape}
      onBlur={(event) => {
        if (event.relatedTarget instanceof Node && !event.currentTarget.contains(event.relatedTarget)) {
          setView(null);
        }
      }}
    >
      <button
        ref={triggerRef}
        type="button"
        aria-expanded={view !== null}
        aria-controls={panelId}
        aria-labelledby={accountLabelId}
        aria-describedby={roleLabelId}
        onClick={() => setView(view ? null : "account")}
        className={`${INTERACTIVE_ROW_STYLE} border border-transparent leading-snug aria-expanded:border-border aria-expanded:bg-muted`}
      >
        <span className="grid size-9 shrink-0 place-items-center rounded-full bg-selection font-semibold text-foreground" aria-hidden="true">
          {session?.email ? session.email.charAt(0).toLocaleUpperCase() : <UserRound className="size-4" />}
        </span>
        <span className="min-w-0 flex-1">
          <span id={accountLabelId} className="block font-semibold">{t("account")}</span>
          <span id={roleLabelId} className="block text-xs text-muted-foreground">
            {activeRole ? t(`roles.${activeRole}`) : t("noActiveRole")}
          </span>
        </span>
        <ChevronsUpDown className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
      </button>

      <section
        ref={panelRef}
        id={panelId}
        hidden={view === null}
        aria-labelledby={accountLabelId}
        className="absolute inset-x-3 bottom-full z-10 mb-1 max-h-[75dvh] overflow-y-auto overscroll-contain rounded-xl border border-border bg-card p-2 text-foreground shadow-lg"
      >
        {view === "roles" ? (
          <>
            <button ref={backRef} type="button" onClick={backToAccount} className={INTERACTIVE_ROW_STYLE}>
              <ArrowLeft className="size-4 shrink-0" aria-hidden="true" />
              {t("backToAccount")}
            </button>
            <RoleSelectionList
              roles={roles}
              selectedRole={activeRole}
              onSelect={changeRole}
              legend={t("activeRoleLabel")}
              roleName={(role) => t(`roles.${role}`)}
            />
          </>
        ) : view === "account" && (
          <>
            <Link ref={profileRef} href="/dashboard/profile" onClick={navigateFromPanel} className={INTERACTIVE_ROW_STYLE}>
              <UserRound className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
              {t("profile")}
            </Link>
            {hasMultipleRoles && (
              <button ref={roleButtonRef} type="button" onClick={() => setView("roles")} className={INTERACTIVE_ROW_STYLE}>
                <ChevronsUpDown className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
                <span className="flex-1">{t("switchRole")}</span>
                <ChevronRight className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
              </button>
            )}
            <AccountPreferences />
            <div className="mt-1 border-t border-border pt-1">
              <button type="button" aria-disabled={signingOut} aria-busy={signingOut} onClick={() => void signOut()} className={`${ROW_STYLE} text-danger hover:bg-danger-surface aria-disabled:opacity-70`}>
                <LogOut className="size-4 shrink-0" aria-hidden="true" />
                {t("logout")}
              </button>
            </div>
          </>
        )}
      </section>
    </div>
  );
}
