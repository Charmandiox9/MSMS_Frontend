import { afterEach, describe, expect, it, vi } from 'vitest';
import { GET } from './route';

describe('GET /api/runtime-config', () => {
  afterEach(() => vi.unstubAllEnvs());

  it('entrega la URL de GraphQL del entorno sin caché', async () => {
    vi.stubEnv('NEXT_PUBLIC_API_URL', '/api/graphql');

    const response = GET();

    expect(response.headers.get('Cache-Control')).toBe('no-store');
    await expect(response.json()).resolves.toEqual({ graphqlUrl: '/api/graphql' });
  });

  it('entrega null si la variable no está configurada', async () => {
    vi.stubEnv('NEXT_PUBLIC_API_URL', undefined);

    await expect(GET().json()).resolves.toEqual({ graphqlUrl: null });
  });

  it('solo expone la URL pública, no otras variables del servidor', async () => {
    vi.stubEnv('NEXT_PUBLIC_API_URL', '/api/graphql');
    vi.stubEnv('JWT_SECRET', 'no-debe-salir');

    expect(Object.keys(await GET().json())).toEqual(['graphqlUrl']);
  });
});
