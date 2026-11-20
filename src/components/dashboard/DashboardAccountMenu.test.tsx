import { fireEvent, render, screen, within } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import type { ComponentProps } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ActiveRoleProvider } from "@/context/ActiveRoleContext";
import type { ActiveSession } from "@/types/auth";
import messages from "../../../messages/es.json";
import DashboardAccountMenu from "./DashboardAccountMenu";

const mocks = vi.hoisted(() => ({
  pathname: "/dashboard",
  replace: vi.fn(),
  refresh: vi.fn(),
  setTheme: vi.fn(),
  resolvedTheme: "light",
  logout: vi.fn(),
  toast: { success: vi.fn(), info: vi.fn(), error: vi.fn() },
}));

vi.mock("@/i18n/routing", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/i18n/routing")>()),
  Link: (props: ComponentProps<"a">) => <a {...props} />,
  usePathname: () => mocks.pathname,
  useRouter: () => ({ replace: mocks.replace, refresh: mocks.refresh }),
}));
vi.mock("next-themes", () => ({
  useTheme: () => ({ resolvedTheme: mocks.resolvedTheme, setTheme: mocks.setTheme }),
}));
vi.mock("@/lib/auth", () => ({ logout: mocks.logout }));
vi.mock("sonner", () => ({ toast: mocks.toast }));

const session: ActiveSession = {
  email: "account@example.invalid",
  roles: ["SYSTEM_ADMIN", "TEACHING_SUPPORT_COORDINATOR"],
};

function renderMenu(initialSession = session, onNavigate = vi.fn()) {
  render(
    <NextIntlClientProvider locale="es" messages={messages} timeZone="America/Santiago">
      <ActiveRoleProvider initialSession={initialSession}>
        <DashboardAccountMenu session={initialSession} onNavigate={onNavigate} />
      </ActiveRoleProvider>
    </NextIntlClientProvider>,
  );
  const trigger = screen.getByRole("button", { name: "Mi cuenta" });
  fireEvent.click(trigger);
  return { trigger, panel: screen.getByRole("region", { name: "Mi cuenta" }), onNavigate };
}

describe("DashboardAccountMenu", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    window.localStorage.clear();
    document.cookie = "MARSYS_LOCALE=; path=/; Max-Age=0";
    window.history.replaceState(null, "", "/dashboard");
    mocks.pathname = "/dashboard";
    mocks.resolvedTheme = "light";
  });

  it("shows the current role and omits role switching for a single assignment", () => {
    const { trigger, panel } = renderMenu({ ...session, roles: ["SYSTEM_ADMIN"] });
    expect(within(trigger).getByText("Administrador del sistema")).toBeDefined();
    expect(within(panel).queryByRole("button", { name: "Cambiar rol" })).toBeNull();
    expect(document.activeElement).toBe(within(panel).getByRole("link", { name: "Mi perfil" }));
  });

  it("closes one account view at a time on Escape and restores focus", () => {
    const { trigger, panel } = renderMenu();
    fireEvent.click(within(panel).getByRole("button", { name: "Cambiar rol" }));
    const back = within(panel).getByRole("button", { name: "Volver a Mi cuenta" });
    expect(document.activeElement).toBe(back);
    fireEvent.keyDown(back, { key: "Escape" });
    const changeRole = within(panel).getByRole("button", { name: "Cambiar rol" });
    expect(document.activeElement).toBe(changeRole);
    fireEvent.keyDown(changeRole, { key: "Escape" });
    expect(trigger.getAttribute("aria-expanded")).toBe("false");
    expect(document.activeElement).toBe(trigger);
  });

  it("keeps a shared route and announces the new active role", () => {
    mocks.pathname = "/dashboard/titulation";
    const { trigger, panel, onNavigate } = renderMenu();
    fireEvent.click(within(panel).getByRole("button", { name: "Cambiar rol" }));
    fireEvent.click(within(panel).getByRole("radio", { name: "Apoyo docente" }));
    expect(within(trigger).getByText("Apoyo docente")).toBeDefined();
    expect(mocks.toast.success).toHaveBeenCalledWith("Cambiaste a Apoyo docente.");
    expect(mocks.replace).not.toHaveBeenCalled();
    expect(onNavigate).not.toHaveBeenCalled();
  });

  it("redirects and announces a role change when the current route is unavailable", () => {
    mocks.pathname = "/dashboard/justifications/management";
    const { panel, onNavigate } = renderMenu();
    fireEvent.click(within(panel).getByRole("button", { name: "Cambiar rol" }));
    fireEvent.click(within(panel).getByRole("radio", { name: "Apoyo docente" }));
    expect(onNavigate).toHaveBeenCalledOnce();
    expect(mocks.replace).toHaveBeenCalledWith("/dashboard");
    expect(mocks.toast.info).toHaveBeenCalledWith(expect.stringMatching(/Apoyo docente.*Inicio/));
  });

  it("uses the resolved theme while allowing an explicit day mode", () => {
    mocks.resolvedTheme = "dark";
    const { panel } = renderMenu();
    const toggle = within(panel).getByRole("switch", { name: "Modo oscuro" });
    expect(toggle).toHaveProperty("checked", true);
    fireEvent.click(toggle);
    expect(mocks.setTheme).toHaveBeenCalledWith("light");
  });

  it("carries the full query and fragment to the same view in the other language", () => {
    mocks.pathname = "/dashboard/titulation";
    window.history.replaceState(null, "", `${mocks.pathname}?career=biology&career=aquaculture#documents`);
    const { panel } = renderMenu();
    fireEvent.click(within(panel).getByRole("radio", { name: "English" }));
    expect(document.cookie).toContain("MARSYS_LOCALE=en");
    expect(mocks.refresh).toHaveBeenCalledOnce();
    expect(mocks.replace).not.toHaveBeenCalled();
  });
});
