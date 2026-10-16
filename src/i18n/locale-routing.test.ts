import { describe, expect, it } from 'vitest';
import { NextRequest } from 'next/server';
import middleware from '../middleware';

function resolvedLocale(cookie?: string) {
  const req = new NextRequest('https://marsys.test/fasol/marsys/login', {
    nextConfig: { basePath: '/fasol/marsys' },
    headers: { 'accept-language': 'en-US,en;q=0.9', ...(cookie ? { cookie } : {}) },
  });
  const response = middleware(req);
  const rewrite = response.headers.get('x-middleware-rewrite');
  return rewrite ? new URL(rewrite).pathname : null;
}

describe('MARSYS language selection under a shared domain', () => {
  it('starts in Spanish even when the browser prefers English', () => {
    expect(resolvedLocale()).toBe('/fasol/marsys/es/login');
  });
  it('ignores the generic locale cookie used by other applications', () => {
    expect(resolvedLocale('NEXT_LOCALE=en')).toBe('/fasol/marsys/es/login');
  });
  it('preserves English explicitly selected in MARSYS', () => {
    expect(resolvedLocale('MARSYS_LOCALE=en')).toBe('/fasol/marsys/en/login');
  });
});
