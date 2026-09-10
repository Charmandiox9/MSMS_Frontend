'use client';

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import type { ActiveSession, UserRoleCode } from '@/types/auth';

interface ActiveRoleContextValue {
  activeRole: UserRoleCode | null;
  roles: UserRoleCode[];
  hasMultipleRoles: boolean;
  setActiveRole: (role: UserRoleCode) => void;
  session: ActiveSession | null;
}

const STORAGE_KEY = 'marsys_active_role';

const ActiveRoleContext = createContext<ActiveRoleContextValue | undefined>(
  undefined
);

export function ActiveRoleProvider({
  children,
  initialSession = null,
}: {
  children: ReactNode;
  initialSession?: ActiveSession | null;
}) {
  const session = initialSession;

  const roles = useMemo<UserRoleCode[]>(() => {
    if (!session?.roles) return [];
    return session.roles as UserRoleCode[];
  }, [session?.roles]);

  const [selectedRole, setSelectedRole] = useState<UserRoleCode | null>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem(STORAGE_KEY) as UserRoleCode | null;
    }
    return null;
  });

  const activeRole: UserRoleCode | null = useMemo(() => {
    if (roles.length === 0) return null;
    if (selectedRole && roles.includes(selectedRole)) {
      return selectedRole;
    }
    return roles[0];
  }, [roles, selectedRole]);

  const setActiveRole = useCallback(
    (newRole: UserRoleCode) => {
      if (roles.includes(newRole)) {
        setSelectedRole(newRole);
        if (typeof window !== 'undefined') {
          localStorage.setItem(STORAGE_KEY, newRole);
        }
      }
    },
    [roles]
  );

  const value = useMemo<ActiveRoleContextValue>(
    () => ({
      activeRole,
      roles,
      hasMultipleRoles: roles.length > 1,
      setActiveRole,
      session,
    }),
    [activeRole, roles, setActiveRole, session]
  );

  return (
    <ActiveRoleContext.Provider value={value}>
      {children}
    </ActiveRoleContext.Provider>
  );
}

export function useActiveRole(): ActiveRoleContextValue {
  const context = useContext(ActiveRoleContext);
  if (!context) {
    throw new Error('useActiveRole must be used within an ActiveRoleProvider');
  }
  return context;
}
