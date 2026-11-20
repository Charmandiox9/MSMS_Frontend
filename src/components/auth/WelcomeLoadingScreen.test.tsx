import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import WelcomeLoadingScreen from "./WelcomeLoadingScreen";

const translations = vi.hoisted(() => ({
  SessionEntry: {
    checkingTitle: "Checking your session",
    checkingDescription: "Confirming access to MARSYS.",
    welcomePersonalized: "Welcome, {name}.",
    welcomeGeneric: "Welcome to MARSYS.",
    welcomeBrand: "MARSYS · Faculty of Marine Sciences",
    welcomeDescription: "Academic and administrative workspace.",
    welcomeFeaturesTitle: "In your workspace, you can",
    preparing: "Preparing your workspace.",
    preparingDescription: "Your dashboard is getting ready.",
    activeRole: "Workspace role",
    "features.academicSecretary.academicInfo": "Maintain career information.",
    "features.academicSecretary.teachers": "Manage faculty and schedules.",
    "features.academicSecretary.records": "Review academic records.",
    "features.default.modules": "Open available modules.",
    "features.default.requests": "Review pending requests.",
    "features.default.updates": "Check recent updates.",
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
        phase="preparing"
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
    expect(screen.getByText("Manage faculty and schedules.")).toBeDefined();
    expect(
      screen.getByRole("region", { name: "Preparing your workspace." })
        .getAttribute("aria-busy"),
    ).toBe("true");
    expect(screen.getByRole("status").textContent).toContain(
      "Your dashboard is getting ready.",
    );
  });

  it("shows a generic welcome when the session has no display name", () => {
    render(<WelcomeLoadingScreen phase="preparing" />);

    expect(
      screen.getByRole("heading", { name: "Welcome to MARSYS." }),
    ).toBeDefined();
    expect(screen.getByText("Open available modules.")).toBeDefined();
  });

  it("keeps session verification distinct from dashboard preparation", () => {
    render(<WelcomeLoadingScreen phase="checking" />);

    expect(
      screen.getByRole("heading", { name: "Checking your session" }),
    ).toBeDefined();
    expect(screen.getByRole("status").textContent).toContain(
      "Confirming access to MARSYS.",
    );
  });
});
