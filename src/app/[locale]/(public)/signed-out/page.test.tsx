import type { ReactNode } from "react";
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import SignedOutPage from "./page";

const copy = vi.hoisted(() => ({
  title: "Sesión cerrada",
  description: "Gracias por trabajar con MARSYS. Tu sesión terminó correctamente; podrás volver a ingresar cuando lo necesites.",
  returnToLogin: "Volver a ingresar",
  returnToHome: "Ir al sitio público",
}));

vi.mock("next-intl/server", () => ({
  getTranslations: async () => (key: keyof typeof copy) => copy[key],
}));

vi.mock("@/i18n/routing", () => ({
  Link: ({
    href,
    children,
    className,
  }: {
    href: string;
    children: ReactNode;
    className?: string;
  }) => <a href={href} className={className}>{children}</a>,
}));

describe("SignedOutPage", () => {
  it("confirms the sign out and offers clear next destinations", async () => {
    render(await SignedOutPage());

    expect(screen.getByRole("heading", { name: copy.title })).toBeDefined();
    expect(screen.getByText(copy.description)).toBeDefined();
    expect(screen.getByRole("link", { name: copy.returnToLogin }).getAttribute("href")).toBe("/login");
    expect(screen.getByRole("link", { name: copy.returnToHome }).getAttribute("href")).toBe("/");
  });
});
