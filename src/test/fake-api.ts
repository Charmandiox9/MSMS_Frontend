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
    if (url.pathname.endsWith('/graphql') && method === 'POST') {
      const payload = typeof init?.body === 'string' ? JSON.parse(init.body) as {
        operationName?: string;
        variables?: { filters?: Record<string, string | number | undefined> };
      } : {};
      const routePath = payload.operationName === 'RepositoryProjects'
        ? '/academic/projects'
        : payload.operationName === 'RepositoryResearch'
          ? '/academic/research'
          : payload.operationName === 'RepositoryResearchOutputs'
            ? '/academic/research-outputs'
          : null;
      if (routePath) {
        const query = new URLSearchParams();
        for (const [key, value] of Object.entries(payload.variables?.filters ?? {})) {
          if (value !== undefined) query.set(key, String(value));
        }
        const request: FakeRequest = {
          method: 'GET', path: routePath, query, body: undefined,
          credentials: init?.credentials,
        };
        requests.push(request);
        const route = table[`GET ${routePath}`];
        if (!route) return Response.json({ errors: [{ message: `Ruta no simulada: ${routePath}` }] });
        const { status = 200, body } = await route(request);
        if (status >= 400) {
          const message = typeof body === 'object' && body !== null && 'message' in body
            ? String((body as { message: unknown }).message)
            : 'GraphQL request failed';
          return Response.json({ errors: [{ message }] }, { status });
        }
        const resultKey = payload.operationName === 'RepositoryProjects'
          ? 'repositoryProjects'
          : payload.operationName === 'RepositoryResearch'
            ? 'repositoryResearch'
            : 'repositoryResearchOutputs';
        const pageBody = body as { items?: Record<string, unknown>[] };
        const isOutput = payload.operationName === 'RepositoryResearchOutputs';
        const items = pageBody.items?.map((item) => ({
          __typename: isOutput ? 'ResearchOutputListRecord' : 'RepositoryListRecord',
          ...item,
          ...(!isOutput && item._count && typeof item._count === 'object'
            ? { outputCount: (item._count as { outputs?: number }).outputs ?? 0 }
            : {}),
          ...(Array.isArray(item.participants)
            ? { participants: item.participants.map((participant) => ({ __typename: 'RepositoryParticipantView', ...participant as object })) }
            : {}),
          ...(item.research && typeof item.research === 'object'
            ? { research: { __typename: 'ResearchOutputResearchView', ...item.research as object } }
            : {}),
          ...(Array.isArray(item.authors)
            ? { authors: item.authors.map((author) => ({ __typename: 'ResearchOutputAuthorView', ...author as object })) }
            : {}),
          ...(Array.isArray(item.projects)
            ? { projects: item.projects.map((project) => ({ __typename: 'ResearchOutputProjectLinkView', ...project as object })) }
            : {}),
        }));
        return Response.json({ data: { [resultKey]: { ...body as object, __typename: isOutput ? 'ResearchOutputListPage' : 'RepositoryListPage', items } } });
      }
    }
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
