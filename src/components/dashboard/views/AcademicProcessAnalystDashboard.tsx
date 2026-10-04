'use client';

import {
  BookOpenCheck,
  ClipboardCheck,
  FileBarChart,
  GraduationCap,
  Users,
} from 'lucide-react';
import { useTranslations } from 'next-intl';
import QuickActionCard from '@/components/dashboard/widgets/QuickActionCard';
import WidgetCard from '@/components/dashboard/widgets/WidgetCard';
import RoleDashboardStats from '@/components/dashboard/RoleDashboardStats';

export default function AcademicProcessAnalystDashboard() {
  const t = useTranslations('DashboardViews.academicProcessAnalyst');

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-black tracking-tight text-foreground md:text-3xl">
          {t('title')}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">{t('subtitle')}</p>
      </div>

      <RoleDashboardStats endpoint="/dashboard/academic-process-analyst" metrics={[
        { key: 'teachers', title: t('stats.teachers'), description: t('stats.teachersDesc'), icon: Users },
        { key: 'activeCourses', title: t('stats.courses'), description: t('stats.coursesDesc'), icon: BookOpenCheck },
        { key: 'activeAssignments', title: t('stats.assignments'), description: t('stats.assignmentsDesc'), icon: ClipboardCheck },
        { key: 'justifications', title: t('stats.justifications'), description: t('stats.justificationsDesc'), icon: FileBarChart },
      ]} />

      <div className="grid gap-6">
          <WidgetCard
            title={t('actionsTitle')}
            subtitle={t('actionsSubtitle')}
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <QuickActionCard
                title={t('actions.reports')}
                description={t('actions.reportsDesc')}
                href="/dashboard/reports"
                icon={FileBarChart}
              />
              <QuickActionCard
                title={t('actions.titulation')}
                description={t('actions.titulationDesc')}
                href="/dashboard/titulation"
                icon={GraduationCap}
              />
            </div>
          </WidgetCard>
      </div>
    </div>
  );
}
