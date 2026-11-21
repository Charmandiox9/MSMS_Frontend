import { act, render, screen, waitFor, fireEvent } from "@testing-library/react";
import { beforeEach, afterEach, describe, expect, it, vi } from "vitest";
import { IntlProvider } from "@/test/render";
import { installFakeApi, ok, fail } from "@/test/fake-api";
import { ACTIVE_ROLE_STORAGE_KEY } from "@/lib/active-role";
import SessionEntry from "./SessionEntry";

const router = vi.hoisted(() => ({ replace: vi.fn() }));
vi.mock("@/i18n/routing", () => ({ useRouter: () => router }));
vi.mock("@/components/auth/LoginPreferences", () => ({ default: () => null }));
function renderEntry(isOAuthCallback = false) {
  return render(
    <IntlProvider>
      <SessionEntry isOAuthCallback={isOAuthCallback}>
        <a href="https://accounts.google.com">Continuar con Google</a>
      </SessionEntry>
    </IntlProvider>,
  );
}

describe("SessionEntry", () => {
  beforeEach(() => {
    router.replace.mockClear();
    localStorage.clear();
  });
  afterEach(() => vi.unstubAllGlobals());

  it("mantiene visible el login mientras comprueba en segundo plano la sesión", () => {
    installFakeApi({ "GET /auth/session": () => new Promise(() => undefined) });
    renderEntry();
    expect(screen.getByText("Continuar con Google")).toBeDefined();
    expect(screen.queryByRole("heading", { name: "Verificando tu sesión" })).toBeNull();
  });
  it("muestra Google solo si el backend no reconoce una sesión válida", async () => {
    installFakeApi({ "GET /auth/session": fail(401, "Unauthorized") });
    renderEntry();
    expect(await screen.findByText("Continuar con Google")).toBeDefined();
    expect(router.replace).not.toHaveBeenCalled();
  });
  it("no vuelve a mostrar el login mientras valida el retorno de Google", async () => {
    let resolveSession: (value: { body: unknown }) => void = () => undefined;
    const api = installFakeApi({
      "GET /auth/session": () =>
        new Promise((resolve) => {
          resolveSession = resolve;
        }),
    });
    renderEntry(true);

    expect(
      screen.getByRole("heading", { name: "Verificando tu sesión" }),
    ).toBeDefined();
    expect(screen.queryByText("Continuar con Google")).toBeNull();
    await waitFor(() => expect(api.calls("GET /auth/session")).toHaveLength(1));

    await act(async () => {
      resolveSession({
        body: {
          email: "ana@example.com",
          roles: ["SYSTEM_ADMIN", "TEACHING_SUPPORT_COORDINATOR"],
        },
      });
    });

    expect(
      await screen.findByRole("heading", { name: "Elige tu vista de trabajo" }),
    ).toBeDefined();
    expect(screen.queryByText("Continuar con Google")).toBeNull();
  });
  it("muestra el login sin excepciones cuando el servidor devuelve solo sub", async () => {
    installFakeApi({ "GET /auth/session": ok({ sub: "user-1", iat: 1 }) });
    renderEntry();
    expect(await screen.findByText("Continuar con Google")).toBeDefined();
    expect(router.replace).not.toHaveBeenCalled();
  });
  it("entra con el único rol autorizado y reemplaza un rol antiguo guardado", async () => {
    localStorage.setItem(ACTIVE_ROLE_STORAGE_KEY, "SYSTEM_ADMIN");
    const api = installFakeApi({
      "GET /auth/session": ok({
        email: "ana@example.com",
        roles: ["ACADEMIC_SECRETARY"],
      }),
    });
    renderEntry();
    await waitFor(() =>
      expect(router.replace).toHaveBeenCalledWith("/dashboard?welcome=1"),
    );
    expect(localStorage.getItem(ACTIVE_ROLE_STORAGE_KEY)).toBe(
      "ACADEMIC_SECRETARY",
    );
    expect(api.calls("GET /auth/session")[0].credentials).toBe("include");
    expect(screen.queryByText("Continuar con Google")).toBeNull();
  });
  it("pregunta qué vista abrir si hay varios roles aunque exista una selección guardada", async () => {
    localStorage.setItem(ACTIVE_ROLE_STORAGE_KEY, "SYSTEM_ADMIN");
    installFakeApi({
      "GET /auth/session": ok({
        email: "ana@example.com",
        roles: ["SYSTEM_ADMIN", "TEACHING_SUPPORT_COORDINATOR"],
      }),
    });
    renderEntry();
    await screen.findByRole("heading", { name: "Elige tu vista de trabajo" });
    expect(router.replace).not.toHaveBeenCalled();
    expect(
      screen.getByRole("button", { name: "Entrar al dashboard" }),
    ).toHaveProperty("disabled", true);
    fireEvent.click(screen.getByRole("radio", { name: "Apoyo docente" }));
    fireEvent.click(
      screen.getByRole("button", { name: "Entrar al dashboard" }),
    );
    expect(localStorage.getItem(ACTIVE_ROLE_STORAGE_KEY)).toBe(
      "TEACHING_SUPPORT_COORDINATOR",
    );
    expect(router.replace).toHaveBeenCalledWith("/dashboard?welcome=1");
    expect(screen.queryByText("Continuar con Google")).toBeNull();
  });
  it("sin roles habilitados dirige a la página sin acceso, sin pedir otro login", async () => {
    installFakeApi({
      "GET /auth/session": ok({ email: "ana@example.com", roles: [] }),
    });
    renderEntry();
    await waitFor(() =>
      expect(router.replace).toHaveBeenCalledWith("/no-access"),
    );
    expect(screen.queryByText("Continuar con Google")).toBeNull();
  });
  it("no interpreta roles repetidos como múltiples vistas", async () => {
    installFakeApi({
      "GET /auth/session": ok({
        email: "ana@example.com",
        roles: ["ACADEMIC_SECRETARY", "ACADEMIC_SECRETARY"],
      }),
    });
    renderEntry();
    await waitFor(() =>
      expect(router.replace).toHaveBeenCalledWith("/dashboard?welcome=1"),
    );
  });
});
