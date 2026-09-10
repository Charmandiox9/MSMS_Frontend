import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import RoleSwitcher from './RoleSwitcher';
import { ActiveRoleProvider } from '@/context/ActiveRoleContext';
import type { ActiveSession } from '@/types/auth';

vi.mock('next-intl', () => ({
  useTranslations: () => (key: string) => {
    const map: Record<string, string> = {
      switchRole: 'Cambiar rol activo',
      switchRoleTitle: 'Roles asignados',
      SYSTEM_ADMIN: 'Administrador del sistema',
      TEACHING_SUPPORT_COORDINATOR: 'Apoyo docente',
    };
    return map[key] ?? key;
  },
}));

describe('RoleSwitcher component', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('should render interactive dropdown when user has multiple roles', () => {
    const multiRoleSession: ActiveSession = {
      email: 'martin.castillo@alumnos.ucn.cl',
      roles: ['SYSTEM_ADMIN', 'TEACHING_SUPPORT_COORDINATOR'],
    };

    render(
      <ActiveRoleProvider initialSession={multiRoleSession}>
        <RoleSwitcher />
      </ActiveRoleProvider>
    );

    const button = screen.getByRole('button', { name: /cambiar rol activo/i });
    expect(button).toBeDefined();

    fireEvent.click(button);

    const options = screen.getAllByRole('option');
    expect(options).toHaveLength(2);
    expect(screen.getByText('Roles asignados')).toBeDefined();
  });

  it('should render only badge when user has a single role', () => {
    const singleRoleSession: ActiveSession = {
      email: 'docente@ucn.cl',
      roles: ['TEACHING_SUPPORT_COORDINATOR'],
    };

    render(
      <ActiveRoleProvider initialSession={singleRoleSession}>
        <RoleSwitcher />
      </ActiveRoleProvider>
    );

    expect(screen.queryByRole('button', { name: /cambiar rol activo/i })).toBeNull();
    expect(screen.getByText('Apoyo docente')).toBeDefined();
  });
});
