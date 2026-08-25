import { defineRouting } from 'next-intl/routing';
import { createNavigation } from 'next-intl/navigation';

export const routing = defineRouting({
  // A list of all locales that are supported
  locales: ['es', 'en'],
  // Used when no locale matches
  defaultLocale: 'es',
  // Ocultar el prefijo /en o /es de la URL
  localePrefix: 'never'
});

// Lightweight wrappers around Next.js' navigation APIs
export const { Link, redirect, usePathname, useRouter, getPathname } = createNavigation(routing);
