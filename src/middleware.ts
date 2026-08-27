import createMiddleware from 'next-intl/middleware';
import { routing } from './i18n/routing';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const intlMiddleware = createMiddleware(routing);

export default function middleware(req: NextRequest) {
  const pathname = req.nextUrl.pathname;
  const hasToken = req.cookies.has('token');

  // 1. Proteger rutas del Dashboard (Si NO hay token, expulsar al Login)
  if (pathname.includes('/dashboard')) {
    if (!hasToken) {
      const localeMatch = pathname.match(/^\/(es|en)/);
      const prefix = localeMatch ? localeMatch[0] : '';
      const url = req.nextUrl.clone();
      url.pathname = `${prefix}/login`;
      return NextResponse.redirect(url);
    }
  }

  // 2. Proteger la ruta de Login (Si YA hay token, saltar directo al Dashboard)
  if (pathname.includes('/login') && hasToken) {
    const localeMatch = pathname.match(/^\/(es|en)/);
    const prefix = localeMatch ? localeMatch[0] : '';
    const url = req.nextUrl.clone();
    url.pathname = `${prefix}/dashboard`;
    return NextResponse.redirect(url);
  }

  // 3. Continuar con el middleware de idiomas (next-intl)
  return intlMiddleware(req);
}

export const config = {
  matcher: [
    '/',
    '/(es|en)/:path*',
    '/((?!api|_next|_vercel|.*\\..*).*)'
  ]
};
