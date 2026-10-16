import { afterEach, describe, expect, it, vi } from 'vitest';

describe('public base path', () => {
  afterEach(() => vi.unstubAllEnvs());
  it('prefixes raw URLs once while preserving absolute URLs', async () => {
    vi.resetModules();
    vi.stubEnv('NEXT_PUBLIC_BASE_PATH', '/fasol/marsys');
    const { withBasePath } = await import('./base-path');
    expect(withBasePath('/api/runtime-config')).toBe('/fasol/marsys/api/runtime-config');
    expect(withBasePath('/fasol/marsys/api/graphql')).toBe('/fasol/marsys/api/graphql');
    expect(withBasePath('https://api.example.test/api')).toBe('https://api.example.test/api');
  });
  it('keeps root deployments unchanged', async () => {
    vi.resetModules();
    vi.stubEnv('NEXT_PUBLIC_BASE_PATH', '');
    const { withBasePath } = await import('./base-path');
    expect(withBasePath('/api/runtime-config')).toBe('/api/runtime-config');
  });
});
