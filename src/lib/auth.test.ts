import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { installFakeApi, TEST_API_BASE_URL } from "@/test/fake-api";

async function loadAuth() {
  vi.resetModules();
  return import("./auth");
}

describe("auth", () => {
  beforeEach(() => {
    vi.stubEnv("NEXT_PUBLIC_API_URL", "http://localhost:3001/api/graphql");
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
  });

  it("arma la URL de login con Google desde la URL de build", async () => {
    const { googleLoginUrl } = await loadAuth();

    expect(googleLoginUrl).toBe("http://localhost:3001/api/auth/google");
  });

  it("devuelve la sesión activa usando cookies", async () => {
    const session = { email: "ana@ucn.cl", roles: ["ACADEMIC_SECRETARY"] };
    const api = installFakeApi({
      "GET /auth/session": () => ({ body: session }),
    });
    const { getActiveSession, hasActiveSession } = await loadAuth();

    await expect(getActiveSession()).resolves.toEqual(session);
    await expect(hasActiveSession()).resolves.toBe(true);
    expect(api.fetchMock).toHaveBeenCalledWith(
      `${TEST_API_BASE_URL}/auth/session`,
      expect.objectContaining({
        credentials: "include",
        cache: "no-store",
        signal: expect.any(AbortSignal),
      }),
    );
  });

  it("devuelve null si la sesión expiró", async () => {
    installFakeApi({
      "GET /auth/session": () => ({
        status: 401,
        body: { message: "Unauthorized" },
      }),
    });
    const { getActiveSession, hasActiveSession } = await loadAuth();

    await expect(getActiveSession()).resolves.toBeNull();
    await expect(hasActiveSession()).resolves.toBe(false);
  });
  it.each([
    { sub: "user-1", iat: 1 },
    { email: "ana@example.test" },
    { email: "ana@example.test", roles: null },
    { email: "ana@example.test", roles: "SYSTEM_ADMIN" },
    { email: "ana@example.test", roles: [123] },
  ])(
    "rechaza una respuesta de sesión incompleta sin considerarla autenticada",
    async (body) => {
      installFakeApi({ "GET /auth/session": () => ({ body }) });
      const { getActiveSession, hasActiveSession } = await loadAuth();
      await expect(getActiveSession()).resolves.toBeNull();
      await expect(hasActiveSession()).resolves.toBe(false);
    },
  );

  it("devuelve null si el backend no responde", async () => {
    const api = installFakeApi();
    api.on("GET /auth/session", () =>
      Promise.reject(new TypeError("Failed to fetch")),
    );
    const { getActiveSession } = await loadAuth();

    await expect(getActiveSession()).resolves.toBeNull();
  });

  it("termina la verificación de sesión si la petición queda pendiente", async () => {
    vi.useFakeTimers();
    const fetchMock = vi.fn((input: RequestInfo | URL, init?: RequestInit) => {
      const url = new URL(String(input), "http://localhost");
      if (url.pathname === "/api/runtime-config") {
        return Promise.resolve(
          Response.json({ graphqlUrl: `${TEST_API_BASE_URL}/graphql` }),
        );
      }

      return new Promise<Response>((_resolve, reject) => {
        init?.signal?.addEventListener(
          "abort",
          () => reject(new DOMException("Aborted", "AbortError")),
          { once: true },
        );
      });
    });
    vi.stubGlobal("fetch", fetchMock);
    const { getActiveSession } = await loadAuth();

    const pendingSession = getActiveSession();
    await vi.runAllTimersAsync();

    await expect(pendingSession).resolves.toBeNull();
    expect(fetchMock).toHaveBeenCalledWith(
      `${TEST_API_BASE_URL}/auth/session`,
      expect.objectContaining({ signal: expect.any(AbortSignal) }),
    );
  });

  it("cierra sesión con POST y cookies", async () => {
    const api = installFakeApi({
      "POST /auth/logout": () => ({ status: 204 }),
    });
    const { logout } = await loadAuth();

    await logout();

    expect(api.calls("POST /auth/logout")).toHaveLength(1);
    expect(api.calls("POST /auth/logout")[0].credentials).toBe("include");
  });
});
