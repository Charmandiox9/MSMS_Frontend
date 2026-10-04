import {
  BookOpenCheck,
  CalendarDays,
  ClipboardCheck,
  ClipboardList,
  FileBarChart,
  GraduationCap,
  History,
  LayoutDashboard,
  Settings,
  ShieldCheck,
  Users,
  type LucideIcon,
} from 'lucide-react';
import type { UserRoleCode } from '@/types/auth';

export type NavigationKey =
  | 'dashboard'
  | 'justifications'
  | 'justificationsManagement'
  | 'academicInformation'
  | 'subjects'
  | 'teachers'
  | 'academicWorkload'
  | 'assistantshipHistory'
  | 'titulation'
  | 'reports'
  | 'users'
  | 'audit'
  | 'settings';

export interface NavigationItem {
  key: NavigationKey;
  href: string;
  icon: LucideIcon;
  allowedRoles?: UserRoleCode[];
}

export interface NavigationSection {
  key: string;
  items: NavigationItem[];
}

export const DASHBOARD_SECTIONS: NavigationSection[] = [
  {
    key: 'main',
    items: [
      {
        key: 'dashboard',
        href: '/dashboard',
        icon: LayoutDashboard,
      },
    ],
  },
  {
    key: 'academic',
    items: [
      {
        key: 'justifications',
        href: '/dashboard/justifications',
        icon: ClipboardCheck,
        allowedRoles: ['TEACHING_SUPPORT_COORDINATOR'],
      },
      {
        key: 'justificationsManagement',
        href: '/dashboard/justifications/management',
        icon: ClipboardList,
        allowedRoles: ['SYSTEM_ADMIN', 'ACADEMIC_SECRETARY'],
      },
      {
        key: 'academicInformation',
        href: '/dashboard/academic-information',
        icon: BookOpenCheck,
        allowedRoles: [
          'SYSTEM_ADMIN',
          'ACADEMIC_SECRETARY',
          'ACADEMIC_PROCESS_ANALYST',
          'TEACHING_SUPPORT_COORDINATOR',
        ],
      },
      {
        key: 'academicWorkload',
        href: '/dashboard/academic-workload',
        icon: CalendarDays,
        allowedRoles: ['SYSTEM_ADMIN', 'TEACHING_SUPPORT_COORDINATOR'],
      },
      {
        key: 'subjects',
        href: '/dashboard/subjects',
        icon: BookOpenCheck,
        allowedRoles: ['SYSTEM_ADMIN', 'ACADEMIC_SECRETARY'],
      },
      {
        key: 'teachers',
        href: '/dashboard/teachers',
        icon: Users,
        allowedRoles: ['SYSTEM_ADMIN', 'ACADEMIC_SECRETARY'],
      },
      {
        key: 'assistantshipHistory',
        href: '/dashboard/assistantship-history',
        icon: History,
        allowedRoles: ['TEACHING_SUPPORT_COORDINATOR'],
      },
      {
        key: 'titulation',
        href: '/dashboard/titulation',
        icon: GraduationCap,
        allowedRoles: [
          'SYSTEM_ADMIN',
          'TEACHING_SUPPORT_COORDINATOR',
          'ACADEMIC_PROCESS_ANALYST',
        ],
      },
    ],
  },
  {
    key: 'analysis',
    items: [
      {
        key: 'reports',
        href: '/dashboard/reports',
        icon: FileBarChart,
        allowedRoles: ['SYSTEM_ADMIN', 'ACADEMIC_PROCESS_ANALYST'],
      },
    ],
  },
  {
    key: 'system',
    items: [
      {
        key: 'users',
        href: '/dashboard/users',
        icon: Users,
        allowedRoles: ['SYSTEM_ADMIN'],
      },
      {
        key: 'audit',
        href: '/dashboard/audit',
        icon: ShieldCheck,
        allowedRoles: ['SYSTEM_ADMIN'],
      },
      {
        key: 'settings',
        href: '/dashboard/settings',
        icon: Settings,
        allowedRoles: ['SYSTEM_ADMIN', 'ACADEMIC_SECRETARY'],
      },
    ],
  },
];

export function getFilteredNavigation(
  sections: NavigationSection[],
  activeRole?: string | null
): NavigationSection[] {
  return sections
    .map((section) => {
      const filteredItems = section.items.filter((item) => {
        if (!item.allowedRoles || item.allowedRoles.length === 0) {
          return true;
        }
        if (!activeRole) {
          return false;
        }
        return item.allowedRoles.includes(activeRole as UserRoleCode);
      });

      return {
        ...section,
        items: filteredItems,
      };
    })
    .filter((section) => section.items.length > 0);
}

export function isRouteAllowed(
  pathname: string,
  sections: NavigationSection[],
  activeRole?: string | null
): boolean {
  for (const section of sections) {
    for (const item of section.items) {
      if (item.href === pathname) {
        if (!item.allowedRoles || item.allowedRoles.length === 0) {
          return true;
        }
        if (!activeRole) {
          return false;
        }
        return item.allowedRoles.includes(activeRole as UserRoleCode);
      }
    }
  }
  return true;
}
