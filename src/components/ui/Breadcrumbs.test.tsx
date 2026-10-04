import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import Breadcrumbs from './Breadcrumbs';
import { ActiveRoleContext } from '@/context/ActiveRoleContext';
import type { UserRoleCode } from '@/types/auth';

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
      justificationsManagement: 'Gestión de justificaciones',
      audit: 'Auditoría',
    };
    return translations[key] ?? key;
  },
}));

function renderWithRole(role: UserRoleCode | null) {
  const contextValue = {
    activeRole: role,
    roles: role ? [role] : [],
    hasMultipleRoles: false,
    setActiveRole: vi.fn(),
    session: null,
  };

  return render(
    <ActiveRoleContext.Provider value={contextValue}>
      <Breadcrumbs />
    </ActiveRoleContext.Provider>,
  );
}

describe('Breadcrumbs component', () => {
  it('renders root crumb on /dashboard route without duplicate dashboard text', () => {
    mockPathname = '/dashboard';
    render(<Breadcrumbs />);

    const nav = screen.getByRole('navigation', { name: /breadcrumb/i });
    expect(nav).toBeDefined();

    const current = screen.getByText('Dashboard');
    expect(current.getAttribute('aria-current')).toBe('page');
  });

  it('renders home icon and target crumb without duplicate Dashboard label on /dashboard/users', () => {
    mockPathname = '/dashboard/users';
    render(<Breadcrumbs />);

    const nav = screen.getByRole('navigation', { name: /breadcrumb/i });
    expect(nav).toBeDefined();

    expect(screen.getByText('Usuarios')).toBeDefined();
    expect(screen.queryAllByText('Dashboard')).toHaveLength(0);
  });

  it('marks the last crumb as current page', () => {
    mockPathname = '/dashboard/justifications';
    render(<Breadcrumbs />);

    const current = screen.getByText('Justificaciones');
    expect(current.getAttribute('aria-current')).toBe('page');
  });

  it('omits unauthorized intermediate route for ACADEMIC_SECRETARY on justifications/management', () => {
    mockPathname = '/dashboard/justifications/management';
    renderWithRole('ACADEMIC_SECRETARY');

    // Should display Gestión de justificaciones as current page
    expect(screen.getByText('Gestión de justificaciones')).toBeDefined();
    // Should NOT expose or leak Justificaciones (which ACADEMIC_SECRETARY has no access to)
    expect(screen.queryByText('Justificaciones')).toBeNull();
  });
});
