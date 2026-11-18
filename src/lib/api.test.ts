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
    const headers = new Headers(init?.headers);
    expect(headers.get('Content-Type')).toBe('application/json');
    expect(headers.get('X-Trace')).toBe('1');
  });

  it('lets the browser add the boundary for multipart form data', async () => {
    const api = installFakeApi({
      'POST /academic/titulations/id/attachments': () => ({
        body: { id: 'attachment-1' },
      }),
    });
    const { apiFetch } = await loadApi();
    const formData = new FormData();
    formData.append('file', new Blob(['%PDF-1.7']), 'acta.pdf');

    await expect(
      apiFetch('/academic/titulations/id/attachments', {
        method: 'POST',
        body: formData,
      }),
    ).resolves.toEqual({ id: 'attachment-1' });

    const [, init] = api.fetchMock.mock.calls.at(-1)!;
    expect(new Headers(init?.headers).has('Content-Type')).toBe(false);
    expect(init?.body).toBe(formData);
  });

  it('devuelve undefined en 204', async () => {
    installFakeApi({ 'DELETE /users/u-1': () => ({ status: 204 }) });
    const { apiFetch } = await loadApi();

    await expect(apiFetch('/users/u-1', { method: 'DELETE' })).resolves.toBeUndefined();
  });

  it('preserves the conflict status so forms can give a corrective message', async () => {
    installFakeApi({ 'POST /academic/titulations': () => ({ status: 409, body: { message: 'Identity conflict' } }) });
    const { apiFetch } = await loadApi();
    await expect(apiFetch('/academic/titulations', { method: 'POST', body: '{}' })).rejects.toMatchObject({ name: 'ApiError', status: 409, message: 'Identity conflict' });
  });

  it('downloads only the expected file type with the session cookie', async () => {
    const contentType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
    const mock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      void init;
      if (String(input) === '/api/runtime-config')
        return Response.json({ graphqlUrl: `${TEST_API_BASE_URL}/graphql` });
      return new Response('word draft', { headers: { 'content-type': contentType } });
    });
    vi.stubGlobal('fetch', mock);
    const { apiFetchFile } = await loadApi();

    await expect(apiFetchFile('/draft', contentType)).resolves.toMatchObject({ type: contentType });
    expect(mock).toHaveBeenLastCalledWith(
      `${TEST_API_BASE_URL}/draft`,
      expect.objectContaining({ cache: 'no-store', credentials: 'include' }),
    );
    await expect(apiFetchFile('/draft', 'application/pdf')).rejects.toThrow();
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
