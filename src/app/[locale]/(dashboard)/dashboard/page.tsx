'use client';

import { useActiveRole } from '@/context/ActiveRoleContext';
import type { ReactNode } from 'react';
import SystemAdminDashboard from '@/components/dashboard/views/SystemAdminDashboard';
import AcademicSecretaryDashboard from '@/components/dashboard/views/AcademicSecretaryDashboard';
import AcademicProcessAnalystDashboard from '@/components/dashboard/views/AcademicProcessAnalystDashboard';
import TeachingSupportCoordinatorDashboard from '@/components/dashboard/views/TeachingSupportCoordinatorDashboard';
import GenericDashboard from '@/components/dashboard/views/GenericDashboard';
import PrivacyOfficerDashboard from '@/components/dashboard/views/PrivacyOfficerDashboard';
import SemesterBudgetAlerts from '@/components/dashboard/SemesterBudgetAlerts';

export default function DashboardPage() {
  const { activeRole } = useActiveRole();

  let dashboard: ReactNode;
  switch (activeRole) {
    case 'SYSTEM_ADMIN':
      dashboard = <SystemAdminDashboard />;
      break;
    case 'ACADEMIC_SECRETARY':
      dashboard = <AcademicSecretaryDashboard />;
      break;
    case 'ACADEMIC_PROCESS_ANALYST':
      return <AcademicProcessAnalystDashboard />;
    case 'TEACHING_SUPPORT_COORDINATOR':
      dashboard = <TeachingSupportCoordinatorDashboard />;
      break;
    case 'PRIVACY_OFFICER':
      return <PrivacyOfficerDashboard />;
    default:
      dashboard = <GenericDashboard />;
  }
  return <><SemesterBudgetAlerts />{dashboard}</>;
}
