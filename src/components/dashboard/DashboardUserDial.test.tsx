import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import DashboardUserDial from "./DashboardUserDial";

vi.mock("next-intl", () => ({
  useLocale: () => "es",
  useTranslations: () => (key: string) => key,
}));

vi.mock("next-themes", () => ({
  useTheme: () => ({ theme: "light", setTheme: vi.fn(), systemTheme: "light" }),
}));

vi.mock("@/i18n/routing", () => ({
  Link: ({
    children,
    ...props
  }: React.PropsWithChildren<Record<string, unknown>>) => (
    <a {...props}>{children}</a>
  ),
  usePathname: () => "/dashboard",
  useRouter: () => ({ replace: vi.fn(), push: vi.fn(), refresh: vi.fn() }),
}));

vi.mock("@/lib/auth", () => ({
  logout: vi.fn(),
}));

vi.mock("animejs", () => ({
  default: Object.assign(
    vi.fn(
      (config?: {
        targets?: HTMLElement | HTMLElement[];
        complete?: () => void;
      }) => {
        if (config?.targets) {
          const targets = Array.isArray(config.targets)
            ? config.targets
            : [config.targets];
          targets.forEach((target) => {
            if (target && target.style) target.style.opacity = "1";
          });
        }
        config?.complete?.();
        return {};
      },
    ),
    {
      stagger: vi.fn(),
    },
  ),
}));

describe("DashboardUserDial", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("opens the navigation menu when the bottom sidebar avatar is clicked", async () => {
    render(
      <DashboardUserDial
        collapsed={false}
        session={{ email: "user@example.com", roles: [] }}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "accountMenu" }));

    await waitFor(() =>
      expect(screen.getByRole("link", { name: "openDashboard" })).toBeTruthy(),
    );

    expect(screen.queryByRole("link", { name: "settings" })).toBeNull();
    const overlay = document.body.lastElementChild as HTMLElement;
    await waitFor(() => expect(overlay.style.opacity).toBe("1"));
  });

  it("names the profile correctly and describes the theme and language destination", async () => {
    render(
      <DashboardUserDial
        collapsed={false}
        session={{ email: "user@example.com", roles: [] }}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: "accountMenu" }));
    expect(await screen.findByRole("link", { name: "profile" })).toBeDefined();
    expect(screen.queryByRole("link", { name: "settings" })).toBeNull();
    expect(screen.getByRole("button", { name: "switchToDark" })).toBeDefined();
    expect(
      screen.getByRole("button", { name: "switchToEnglish" }),
    ).toBeDefined();
  });

  it("shows a descriptive tooltip on pointer hover and keyboard focus", async () => {
    render(
      <DashboardUserDial
        collapsed={false}
        session={{ email: "user@example.com", roles: [] }}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: "accountMenu" }));
    const profile = await screen.findByRole("link", { name: "profile" });
    fireEvent.pointerEnter(profile.parentElement!);
    expect((await screen.findByRole("tooltip")).textContent).toBe("profile");
    expect(profile.getAttribute("aria-describedby")).toBe(
      screen.getByRole("tooltip").id,
    );
    fireEvent.pointerLeave(profile.parentElement!);
    expect(screen.queryByRole("tooltip")).toBeNull();
    fireEvent.focus(screen.getByRole("button", { name: "switchToEnglish" }));
    expect((await screen.findByRole("tooltip")).textContent).toBe(
      "switchToEnglish",
    );
  });

  it("keeps the menu visible when reduced motion is enabled", async () => {
    vi.spyOn(window, "matchMedia").mockImplementation((query: string) => ({
      matches: query === "(prefers-reduced-motion: reduce)",
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }));

    render(
      <DashboardUserDial
        collapsed={false}
        session={{ email: "user@example.com", roles: [] }}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "accountMenu" }));

    await waitFor(() =>
      expect(screen.getByRole("link", { name: "openDashboard" })).toBeTruthy(),
    );

    expect(screen.queryByRole("link", { name: "settings" })).toBeNull();
    const overlay = document.body.lastElementChild as HTMLElement;
    expect(overlay.style.opacity).toBe("1");
  });
});
