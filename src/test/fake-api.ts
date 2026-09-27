import { vi } from 'vitest';

export const TEST_API_BASE_URL = 'http://api.test/api';

export interface FakeRequest {
  method: string;
  path: string;
  query: URLSearchParams;
  body: unknown;
  credentials?: RequestCredentials;
}

export interface FakeResponse {
  status?: number;
  body?: unknown;
}

type Route = (request: FakeRequest) => FakeResponse | Promise<FakeResponse>;

/**
 * Reemplaza `fetch` por un backend simulado. Las rutas se declaran como
 * `'MÉTODO /ruta'` relativas a `/api` y reciben el cuerpo ya parseado.
 * `/api/runtime-config` responde con la URL del backend de pruebas.
 */
export function installFakeApi(routes: Record<string, Route> = {}) {
  const requests: FakeRequest[] = [];
  const table = { ...routes };

  const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = new URL(String(input), 'http://localhost');
    if (url.pathname === '/api/runtime-config') {
      return Response.json({ graphqlUrl: `${TEST_API_BASE_URL}/graphql` });
    }

    const method = (init?.method ?? 'GET').toUpperCase();
    const path = url.pathname.replace(/^\/api/, '');
    const request: FakeRequest = {
      method,
      path,
      query: url.searchParams,
      body: typeof init?.body === 'string' ? JSON.parse(init.body) : undefined,
      credentials: init?.credentials,
    };
    requests.push(request);

    const route = table[`${method} ${path}`];
    if (!route) {
      return Response.json({ message: `Ruta no simulada: ${method} ${path}` }, { status: 404 });
    }
    const { status = 200, body } = await route(request);
    return status === 204 ? new Response(null, { status }) : Response.json(body ?? null, { status });
  });

  vi.stubGlobal('fetch', fetchMock);

  return {
    fetchMock,
    requests,
    /** Registra o reemplaza una ruta después de montar la API. */
    on(key: string, route: Route) {
      table[key] = route;
    },
    /** Peticiones hechas a una ruta concreta, por ejemplo `'PATCH /justifications/j1/decision'`. */
    calls(key: string) {
      return requests.filter((request) => `${request.method} ${request.path}` === key);
    },
  };
}

export const ok = (body: unknown): Route => () => ({ body });
export const fail = (status: number, message: string | string[]): Route => () => ({
  status,
  body: { statusCode: status, message },
});
