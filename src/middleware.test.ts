import { NextRequest } from 'next/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const intlMiddleware = vi.hoisted(() => vi.fn(() => new Response('intl')));
vi.mock('next-intl/middleware', () => ({ default: () => intlMiddleware }));
vi.mock('./i18n/routing', () => ({ routing: {} }));

import middleware, { config } from './middleware';

function request(path: string, cookies: Record<string, string> = {}) {
  const req = new NextRequest(new URL(path, 'https://marsys.test'));
  for (const [name, value] of Object.entries(cookies)) req.cookies.set(name, value);
  return req;
}

function location(response: Response) {
  const header = response.headers.get('location');
  return header ? new URL(header).pathname + new URL(header).search : null;
}

describe('middleware', () => {
  beforeEach(() => {
    intlMiddleware.mockClear();
  });

  it.each([
    ['/es/auth/callback?route=/dashboard/justifications', '/dashboard/justifications'],
    ['/auth/callback?route=/no-access', '/no-access'],
    ['/auth/callback', '/dashboard'],
  ])('el callback de OAuth redirige %s a %s', (path, expected) => {
    const response = middleware(request(path));

    expect(response.status).toBe(307);
    expect(location(response)).toBe(expected);
  });

  it.each([
    'https://evil.test/dashboard',
    '//evil.test/dashboard',
    '/login',
    'javascript:alert(1)',
  ])('el callback no permite redirecciones abiertas (%s)', (route) => {
    const response = middleware(request(`/auth/callback?route=${encodeURIComponent(route)}`));

    expect(new URL(response.headers.get('location')!).origin).toBe('https://marsys.test');
    expect(location(response)).toBe('/dashboard');
  });

  it.each([
    [{ token: 'jwt' }, '/es/login', '/es/dashboard'],
    [{ session: 'redis-id' }, '/en/login', '/en/dashboard'],
    [{ token: 'jwt' }, '/login', '/dashboard'],
  ])('con cookie de sesión, /login redirige al dashboard', (cookies, path, expected) => {
    const response = middleware(request(path, cookies));

    expect(location(response)).toBe(expected);
    expect(intlMiddleware).not.toHaveBeenCalled();
  });

  it('sin cookie deja pasar /login al middleware de idioma', () => {
    const response = middleware(request('/es/login'));

    expect(intlMiddleware).toHaveBeenCalledTimes(1);
    expect(response.headers.get('location')).toBeNull();
  });

  it('no intercepta la API ni los estáticos', () => {
    const [, , catchAll] = config.matcher;
    const pattern = new RegExp(`^${catchAll}$`);

    expect(pattern.test('/dashboard')).toBe(true);
    expect(pattern.test('/api/runtime-config')).toBe(false);
    expect(pattern.test('/_next/static/chunk.js')).toBe(false);
    expect(pattern.test('/favicon.ico')).toBe(false);
  });
});
