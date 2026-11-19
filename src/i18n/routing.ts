import { defineRouting } from 'next-intl/routing';
import { createNavigation } from 'next-intl/navigation';

export const LOCALE_COOKIE_NAME = 'MARSYS_LOCALE';

export const routing = defineRouting({
  locales: ['es', 'en'],
  defaultLocale: 'es',
  localePrefix: 'never',
  // Do not inherit NEXT_LOCALE from other applications on the institutional host.
  localeCookie: { name: LOCALE_COOKIE_NAME },
});

export const { Link, redirect, usePathname, useRouter, getPathname } = createNavigation(routing);
