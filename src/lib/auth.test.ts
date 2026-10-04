import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { installFakeApi, TEST_API_BASE_URL } from '@/test/fake-api';

async function loadAuth() {
  vi.resetModules();
  return import('./auth');
}

describe('auth', () => {
  beforeEach(() => {
    vi.stubEnv('NEXT_PUBLIC_API_URL', 'http://localhost:3001/api/graphql');
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
  });

  it('arma la URL de login con Google desde la URL de build', async () => {
    const { googleLoginUrl } = await loadAuth();

    expect(googleLoginUrl).toBe('http://localhost:3001/api/auth/google');
  });

  it('devuelve la sesión activa usando cookies', async () => {
    const session = { email: 'ana@ucn.cl', roles: ['ACADEMIC_SECRETARY'] };
    const api = installFakeApi({ 'GET /auth/session': () => ({ body: session }) });
    const { getActiveSession, hasActiveSession } = await loadAuth();

    await expect(getActiveSession()).resolves.toEqual(session);
    await expect(hasActiveSession()).resolves.toBe(true);
    expect(api.fetchMock).toHaveBeenCalledWith(`${TEST_API_BASE_URL}/auth/session`, { credentials: 'include' });
  });

  it('devuelve null si la sesión expiró', async () => {
    installFakeApi({ 'GET /auth/session': () => ({ status: 401, body: { message: 'Unauthorized' } }) });
    const { getActiveSession, hasActiveSession } = await loadAuth();

    await expect(getActiveSession()).resolves.toBeNull();
    await expect(hasActiveSession()).resolves.toBe(false);
  });

  it('devuelve null si el backend no responde', async () => {
    const api = installFakeApi();
    api.on('GET /auth/session', () => Promise.reject(new TypeError('Failed to fetch')));
    const { getActiveSession } = await loadAuth();

    await expect(getActiveSession()).resolves.toBeNull();
  });

  it('cierra sesión con POST y cookies', async () => {
    const api = installFakeApi({ 'POST /auth/logout': () => ({ status: 204 }) });
    const { logout } = await loadAuth();

    await logout();

    expect(api.calls('POST /auth/logout')).toHaveLength(1);
    expect(api.calls('POST /auth/logout')[0].credentials).toBe('include');
  });
});
