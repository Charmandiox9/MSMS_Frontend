import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { installFakeApi, TEST_API_BASE_URL } from '@/test/fake-api';

async function loadApi() {
  vi.resetModules();
  return import('./api');
}

describe('apiFetch', () => {
  beforeEach(() => {
    vi.stubEnv('NEXT_PUBLIC_API_URL', 'http://build.test/api/graphql');
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
  });

  it('usa la URL de runtime, envía cookies y JSON', async () => {
    const api = installFakeApi({ 'GET /justifications': () => ({ body: [{ id: 'j-1' }] }) });
    const { apiFetch } = await loadApi();

    await expect(apiFetch('/justifications', { headers: { 'X-Trace': '1' } })).resolves.toEqual([{ id: 'j-1' }]);

    const [url, init] = api.fetchMock.mock.calls.at(-1)!;
    expect(url).toBe(`${TEST_API_BASE_URL}/justifications`);
    expect(init?.credentials).toBe('include');
    expect(init?.headers).toEqual({ 'Content-Type': 'application/json', 'X-Trace': '1' });
  });

  it('devuelve undefined en 204', async () => {
    installFakeApi({ 'DELETE /users/u-1': () => ({ status: 204 }) });
    const { apiFetch } = await loadApi();

    await expect(apiFetch('/users/u-1', { method: 'DELETE' })).resolves.toBeUndefined();
  });

  it('convierte los errores de validación de Nest en un mensaje legible', async () => {
    installFakeApi({
      'PATCH /justifications/j-1/decision': () => ({
        status: 400,
        body: { statusCode: 400, message: ['status must be one of: ACCEPTED, REJECTED', 'reasonCategory must be a string'] },
      }),
    });
    const { apiFetch } = await loadApi();

    await expect(apiFetch('/justifications/j-1/decision', { method: 'PATCH', body: '{}' })).rejects.toThrow(
      'status must be one of: ACCEPTED, REJECTED · reasonCategory must be a string',
    );
  });

  it('usa un mensaje genérico si el error no trae JSON', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async (input: RequestInfo | URL) =>
        String(input) === '/api/runtime-config'
          ? Response.json({ graphqlUrl: null })
          : new Response('<html>Bad gateway</html>', { status: 502 }),
      ),
    );
    const { apiFetch } = await loadApi();

    await expect(apiFetch('/justifications')).rejects.toThrow('No se pudo completar la solicitud');
  });

  it('falla sin llamar a la red si no hay URL configurada', async () => {
    vi.stubEnv('NEXT_PUBLIC_API_URL', '');
    const fetchMock = vi.fn(async () => Response.json({ graphqlUrl: null }));
    vi.stubGlobal('fetch', fetchMock);
    const { apiFetch } = await loadApi();

    await expect(apiFetch('/justifications')).rejects.toThrow('API URL no configurada');
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock).toHaveBeenCalledWith('/api/runtime-config', { cache: 'no-store' });
  });
});
