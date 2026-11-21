import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import SignedOutPage from "./page";

const mocks = vi.hoisted(() => ({
  replace: vi.fn(),
  logout: vi.fn(),
}));

vi.mock("next-intl/server", () => ({
  getTranslations: async (namespace: string) => (key: string) => {
    if (namespace === "SignedOut") {
      return {
        title: "Cerrando sesión",
        description: "Te llevaremos al inicio de sesión.",
        retry: "Reintentar cierre de sesión",
      }[key as "title" | "description" | "retry"];
    }
    return "No se pudo cerrar la sesión.";
  },
}));

vi.mock("@/i18n/routing", () => ({
  useRouter: () => ({ replace: mocks.replace }),
}));
vi.mock("@/lib/auth", () => ({ logout: mocks.logout }));

describe("SignedOutPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(mocks.logout).mockResolvedValue(undefined);
  });

  it("shows a transient state and redirects to login after sign out completes", async () => {
    render(await SignedOutPage());

    expect(screen.getByRole("heading", { name: "Cerrando sesión" })).toBeDefined();
    expect(screen.getByRole("status").textContent).toContain("inicio de sesión");
    await waitFor(() => expect(mocks.replace).toHaveBeenCalledWith("/login"));
    expect(mocks.logout).toHaveBeenCalledOnce();
  });

  it("allows retry when the logout request fails", async () => {
    vi.mocked(mocks.logout)
      .mockRejectedValueOnce(new Error("Network error"))
      .mockResolvedValueOnce(undefined);

    render(await SignedOutPage());

    expect(await screen.findByRole("alert")).toBeDefined();
    fireEvent.click(screen.getByRole("button", { name: "Reintentar cierre de sesión" }));

    await waitFor(() => expect(mocks.replace).toHaveBeenCalledWith("/login"));
    expect(mocks.logout).toHaveBeenCalledTimes(2);
  });
});
