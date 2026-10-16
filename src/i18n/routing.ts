import { defineRouting } from 'next-intl/routing';
import { createNavigation } from 'next-intl/navigation';

export const routing = defineRouting({
  locales: ['es', 'en'],
  defaultLocale: 'es',
  localePrefix: 'never',
  // Do not inherit NEXT_LOCALE from other applications on the institutional host.
  localeCookie: { name: 'MARSYS_LOCALE' },
});

export const { Link, redirect, usePathname, useRouter, getPathname } = createNavigation(routing);
