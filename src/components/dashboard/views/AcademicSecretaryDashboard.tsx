'use client';

import {
  BookOpenCheck,
  ClipboardList,
  FileSpreadsheet,
  GraduationCap,
  Users,
} from 'lucide-react';
import { useTranslations } from 'next-intl';
import QuickActionCard from '@/components/dashboard/widgets/QuickActionCard';
import WidgetCard from '@/components/dashboard/widgets/WidgetCard';
import RoleDashboardStats from '@/components/dashboard/RoleDashboardStats';

export default function AcademicSecretaryDashboard() {
  const t = useTranslations('DashboardViews.academicSecretary');

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-black tracking-tight text-foreground md:text-3xl">
          {t('title')}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">{t('subtitle')}</p>
      </div>

      <RoleDashboardStats endpoint="/dashboard/academic-secretary" metrics={[
        { key: 'teachers', title: t('stats.faculty'), description: t('stats.facultyDesc'), icon: Users },
        { key: 'activeCourses', title: t('stats.courses'), description: t('stats.coursesDesc'), icon: BookOpenCheck },
        { key: 'activeSchedules', title: t('stats.schedules'), description: t('stats.schedulesDesc'), icon: ClipboardList },
        { key: 'pendingJustifications', title: t('stats.pending'), description: t('stats.pendingDesc'), icon: GraduationCap },
      ]} />

      <div className="grid gap-6">
          <WidgetCard
            title={t('actionsTitle')}
            subtitle={t('actionsSubtitle')}
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <QuickActionCard
                title={t('actions.academicInfo')}
                description={t('actions.academicInfoDesc')}
                href="/dashboard/academic-information"
                icon={FileSpreadsheet}
              />
              <QuickActionCard
                title={t('actions.records')}
                description={t('actions.recordsDesc')}
                href="/dashboard/academic-information"
                icon={BookOpenCheck}
              />
            </div>
          </WidgetCard>
      </div>
    </div>
  );
}
