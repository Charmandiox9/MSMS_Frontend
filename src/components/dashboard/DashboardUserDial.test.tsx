import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import DashboardUserDial from './DashboardUserDial';

vi.mock('next-intl', () => ({
  useLocale: () => 'es',
  useTranslations: () => (key: string) => key,
}));

vi.mock('next-themes', () => ({
  useTheme: () => ({ theme: 'light', setTheme: vi.fn(), systemTheme: 'light' }),
}));

vi.mock('@/i18n/routing', () => ({
  Link: ({ children, ...props }: React.PropsWithChildren<Record<string, unknown>>) => (
    <a {...props}>{children}</a>
  ),
  usePathname: () => '/dashboard',
  useRouter: () => ({ replace: vi.fn(), push: vi.fn(), refresh: vi.fn() }),
}));

vi.mock('@/lib/auth', () => ({
  logout: vi.fn(),
}));

describe('DashboardUserDial', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('opens the navigation menu when the bottom sidebar avatar is clicked', async () => {
    render(
      <DashboardUserDial
        collapsed={false}
        session={{ email: 'user@example.com', roles: [] }}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'accountMenu' }));

    await waitFor(() => expect(screen.getByRole('link', { name: 'openDashboard' })).toBeTruthy());

    const overlay = document.body.lastElementChild as HTMLElement;
    expect(overlay.style.opacity).toBe('1');
  });

  it('keeps the menu visible when reduced motion is enabled', async () => {
    vi.spyOn(window, 'matchMedia').mockImplementation((query: string) => ({
      matches: query === '(prefers-reduced-motion: reduce)',
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }));

    render(
      <DashboardUserDial
        collapsed={false}
        session={{ email: 'user@example.com', roles: [] }}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'accountMenu' }));

    await waitFor(() => expect(screen.getByRole('link', { name: 'openDashboard' })).toBeTruthy());

    const overlay = document.body.lastElementChild as HTMLElement;
    expect(overlay.style.opacity).toBe('1');
  });
});
