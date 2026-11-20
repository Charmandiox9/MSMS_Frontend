import type { ComponentProps } from 'react';
import { NextIntlClientProvider } from 'next-intl';
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import es from '../../../messages/es.json';
import en from '../../../messages/en.json';
import Breadcrumbs from './Breadcrumbs';

let pathname = '/dashboard';
vi.mock('@/i18n/routing', () => ({
  Link: ({ href, children, ...props }: ComponentProps<'a'>) => (
    <a href={href} {...props}>{children}</a>
  ),
  usePathname: () => pathname,
}));

describe('Breadcrumb translations', () => {
  it.each([
    ['es', es, 'Historial académico'],
    ['en', en, 'Academic history'],
  ] as const)(
    'renders academic history without missing translations in %s',
    (locale, messages, label) => {
      const onError = vi.fn();
      pathname = '/dashboard/students/11111111-1111-4111-8111-111111111111/progress';
      render(
        <NextIntlClientProvider
          locale={locale}
          messages={messages}
          timeZone="America/Santiago"
          onError={onError}
        >
          <Breadcrumbs />
        </NextIntlClientProvider>,
      );

      expect(screen.getByRole('navigation', { name: messages.DashboardNav.breadcrumb })).toBeDefined();
      expect(screen.getByText(label).getAttribute('aria-current')).toBe('page');
      expect(screen.queryByText('11111111-1111-4111-8111-111111111111')).toBeNull();
      expect(onError).not.toHaveBeenCalled();
    },
  );

  it('does not call the translator for an unmapped route segment', () => {
    const onError = vi.fn();
    pathname = '/dashboard/settings/unknown-section';
    render(
      <NextIntlClientProvider locale="es" messages={es} timeZone="America/Santiago" onError={onError}>
        <Breadcrumbs />
      </NextIntlClientProvider>,
    );
    expect(screen.getByText('unknown-section').getAttribute('aria-current')).toBe('page');
    expect(onError).not.toHaveBeenCalled();
  });
});
