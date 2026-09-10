import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import Breadcrumbs from './Breadcrumbs';

let mockPathname = '/dashboard';

vi.mock('@/i18n/routing', () => ({
  Link: ({ children, href, ...props }: { children: React.ReactNode; href: string; [key: string]: unknown }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
  usePathname: () => mockPathname,
}));

vi.mock('next-intl', () => ({
  useTranslations: () => (key: string) => {
    const translations: Record<string, string> = {
      dashboard: 'Dashboard',
      users: 'Usuarios',
      justifications: 'Justificaciones',
      audit: 'Auditoría',
    };
    return translations[key] ?? key;
  },
}));

describe('Breadcrumbs component', () => {
  it('should render null on single segment route like /dashboard', () => {
    mockPathname = '/dashboard';
    const { container } = render(<Breadcrumbs />);
    expect(container.firstChild).toBeNull();
  });

  it('should render correct crumbs on nested path /dashboard/users', () => {
    mockPathname = '/dashboard/users';
    render(<Breadcrumbs />);

    const nav = screen.getByRole('navigation', { name: /breadcrumb/i });
    expect(nav).toBeDefined();

    expect(screen.getByText('Usuarios')).toBeDefined();
  });

  it('should mark the last crumb as current page', () => {
    mockPathname = '/dashboard/justifications';
    render(<Breadcrumbs />);

    const current = screen.getByText('Justificaciones');
    expect(current.getAttribute('aria-current')).toBe('page');
  });
});
