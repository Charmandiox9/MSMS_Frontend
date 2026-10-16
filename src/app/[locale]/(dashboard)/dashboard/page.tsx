'use client';

import { useActiveRole } from '@/context/ActiveRoleContext';
import SystemAdminDashboard from '@/components/dashboard/views/SystemAdminDashboard';
import AcademicSecretaryDashboard from '@/components/dashboard/views/AcademicSecretaryDashboard';
import AcademicProcessAnalystDashboard from '@/components/dashboard/views/AcademicProcessAnalystDashboard';
import TeachingSupportCoordinatorDashboard from '@/components/dashboard/views/TeachingSupportCoordinatorDashboard';
import GenericDashboard from '@/components/dashboard/views/GenericDashboard';

export default function DashboardPage() {
  const { activeRole } = useActiveRole();

  switch (activeRole) {
    case 'SYSTEM_ADMIN':
      return <SystemAdminDashboard />;
    case 'ACADEMIC_SECRETARY':
      return <AcademicSecretaryDashboard />;
    case 'ACADEMIC_PROCESS_ANALYST':
      return <AcademicProcessAnalystDashboard />;
    case 'TEACHING_SUPPORT_COORDINATOR':
      return <TeachingSupportCoordinatorDashboard />;
    default:
      return <GenericDashboard />;
  }
}
