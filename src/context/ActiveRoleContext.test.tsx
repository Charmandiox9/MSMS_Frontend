import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import { ActiveRoleProvider, useActiveRole } from './ActiveRoleContext';
import type { ActiveSession } from '@/types/auth';

const mockSession: ActiveSession = {
  email: 'martin.castillo@alumnos.ucn.cl',
  roles: ['SYSTEM_ADMIN', 'TEACHING_SUPPORT_COORDINATOR'],
};

describe('ActiveRoleContext', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('should initialize activeRole with the first role by default', () => {
    const { result } = renderHook(() => useActiveRole(), {
      wrapper: ({ children }) => (
        <ActiveRoleProvider initialSession={mockSession}>
          {children}
        </ActiveRoleProvider>
      ),
    });

    expect(result.current.activeRole).toBe('SYSTEM_ADMIN');
    expect(result.current.hasMultipleRoles).toBe(true);
    expect(result.current.roles).toHaveLength(2);
  });

  it('should restore saved role from localStorage when valid', () => {
    localStorage.setItem('marsys_active_role', 'TEACHING_SUPPORT_COORDINATOR');

    const { result } = renderHook(() => useActiveRole(), {
      wrapper: ({ children }) => (
        <ActiveRoleProvider initialSession={mockSession}>
          {children}
        </ActiveRoleProvider>
      ),
    });

    expect(result.current.activeRole).toBe('TEACHING_SUPPORT_COORDINATOR');
  });

  it('should update activeRole and persist to localStorage when setActiveRole is called', () => {
    const { result } = renderHook(() => useActiveRole(), {
      wrapper: ({ children }) => (
        <ActiveRoleProvider initialSession={mockSession}>
          {children}
        </ActiveRoleProvider>
      ),
    });

    act(() => {
      result.current.setActiveRole('TEACHING_SUPPORT_COORDINATOR');
    });

    expect(result.current.activeRole).toBe('TEACHING_SUPPORT_COORDINATOR');
    expect(localStorage.getItem('marsys_active_role')).toBe(
      'TEACHING_SUPPORT_COORDINATOR'
    );
  });

  it('should not change activeRole if an unauthorized role is passed', () => {
    const { result } = renderHook(() => useActiveRole(), {
      wrapper: ({ children }) => (
        <ActiveRoleProvider initialSession={mockSession}>
          {children}
        </ActiveRoleProvider>
      ),
    });

    act(() => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      result.current.setActiveRole('UNAUTHORIZED_ROLE' as any);
    });

    expect(result.current.activeRole).toBe('SYSTEM_ADMIN');
  });
});
