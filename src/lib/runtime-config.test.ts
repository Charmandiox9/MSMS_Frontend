import { afterEach, describe, expect, it, vi } from 'vitest';

async function loadRuntimeConfig(buildTimeUrl?: string) {
  vi.resetModules();
  vi.stubEnv('NEXT_PUBLIC_API_URL', buildTimeUrl ?? '');
  return import('./runtime-config');
}

describe('runtime-config', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
  });

  it('prefiere la URL entregada en runtime y le quita /graphql', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => Response.json({ graphqlUrl: 'https://marsys.test/api/graphql/' })));
    const { resolveApiBaseUrl } = await loadRuntimeConfig('http://localhost:3001/api/graphql');

    await expect(resolveApiBaseUrl()).resolves.toBe('https://marsys.test/api');
  });

  it('consulta /api/runtime-config una sola vez', async () => {
    const fetchMock = vi.fn(async () => Response.json({ graphqlUrl: '/api/graphql' }));
    vi.stubGlobal('fetch', fetchMock);
    const { resolveApiBaseUrl } = await loadRuntimeConfig();

    await resolveApiBaseUrl();
    await resolveApiBaseUrl();

    expect(fetchMock).toHaveBeenCalledTimes(1);
    await expect(resolveApiBaseUrl()).resolves.toBe('/api');
  });

  it.each([
    ['la respuesta no es OK', async () => new Response(null, { status: 500 })],
    ['la red falla', async () => Promise.reject(new TypeError('Failed to fetch'))],
    ['runtime no trae URL', async () => Response.json({ graphqlUrl: null })],
  ])('vuelve a la URL de build si %s', async (_case, response) => {
    vi.stubGlobal('fetch', vi.fn(response));
    const { resolveApiBaseUrl } = await loadRuntimeConfig('http://localhost:3001/api/graphql');

    await expect(resolveApiBaseUrl()).resolves.toBe('http://localhost:3001/api');
  });

  it('expone la URL de build para el login con Google', async () => {
    const { getBuildTimeAuthBaseUrl } = await loadRuntimeConfig('http://localhost:3001/api/graphql');

    expect(getBuildTimeAuthBaseUrl()).toBe('http://localhost:3001/api');
  });
});
