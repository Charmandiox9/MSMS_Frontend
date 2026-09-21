import createMiddleware from 'next-intl/middleware';
import { routing } from './i18n/routing';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const intlMiddleware = createMiddleware(routing);

export default function middleware(req: NextRequest) {
  const pathname = req.nextUrl.pathname;
  const hasToken = req.cookies.has('token') || req.cookies.has('session');

  if (pathname.includes('/auth/callback')) {
    const route = req.nextUrl.searchParams.get('route') || '/dashboard';
    const target = route.startsWith('/dashboard') || route === '/no-access' ? route : '/dashboard';
    const url = req.nextUrl.clone();
    url.pathname = target;
    url.search = '';
    return NextResponse.redirect(url);
  }

  if (pathname.includes('/dashboard')) {
    if (!hasToken) {
      const localeMatch = pathname.match(/^\/(es|en)/);
      const prefix = localeMatch ? localeMatch[0] : '';
      const url = req.nextUrl.clone();
      url.pathname = `${prefix}/login`;
      return NextResponse.redirect(url);
    }
  }

  if (pathname.includes('/login') && hasToken) {
    const localeMatch = pathname.match(/^\/(es|en)/);
    const prefix = localeMatch ? localeMatch[0] : '';
    const url = req.nextUrl.clone();
    url.pathname = `${prefix}/dashboard`;
    return NextResponse.redirect(url);
  }

  return intlMiddleware(req);
}

export const config = {
  matcher: [
    '/',
    '/(es|en)/:path*',
    '/((?!api|_next|_vercel|.*\\..*).*)'
  ]
};
