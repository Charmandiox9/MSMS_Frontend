import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import WelcomeLoadingScreen from "./WelcomeLoadingScreen";

const translations = vi.hoisted(() => ({
  SessionEntry: {
    checkingTitle: "Checking your session",
    checkingDescription: "Confirming access to MARSYS.",
    welcomePersonalized: "Welcome, {name}.",
    welcomeGeneric: "Welcome to MARSYS.",
    preparing: "Preparing your workspace.",
    activeRole: "Workspace role",
  },
  "DashboardNav.roles": {
    ACADEMIC_SECRETARY: "Academic secretary",
  },
}));

vi.mock("next-intl", () => ({
  useTranslations: (namespace: keyof typeof translations) =>
    (key: string, values?: Record<string, string>) => {
      const message = translations[namespace][key as never] as string;
      return Object.entries(values ?? {}).reduce(
        (result, [name, value]) => result.replace(`{${name}}`, value),
        message,
      );
    },
}));

describe("WelcomeLoadingScreen", () => {
  it("greets the authenticated user and identifies the active role", () => {
    render(
      <WelcomeLoadingScreen
        phase="entering"
        displayName="María González"
        activeRole="ACADEMIC_SECRETARY"
      />,
    );

    expect(
      screen.getByRole("heading", {
        name: "Welcome, María González.",
      }),
    ).toBeDefined();
    expect(screen.getByText("Academic secretary")).toBeDefined();
    expect(screen.getByRole("status").getAttribute("aria-busy")).toBe("true");
  });

  it("shows a generic welcome when the session has no display name", () => {
    render(<WelcomeLoadingScreen phase="entering" />);

    expect(
      screen.getByRole("heading", { name: "Welcome to MARSYS." }),
    ).toBeDefined();
  });
});
