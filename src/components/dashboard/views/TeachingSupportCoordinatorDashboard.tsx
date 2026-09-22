'use client';

import {
  CalendarDays,
  ClipboardCheck,
  PlusCircle,
  UserCheck,
  Users,
} from 'lucide-react';
import { useTranslations } from 'next-intl';
import QuickActionCard from '@/components/dashboard/widgets/QuickActionCard';
import WidgetCard from '@/components/dashboard/widgets/WidgetCard';
import RoleDashboardStats from '@/components/dashboard/RoleDashboardStats';
import CoordinatorInboxWidget from '@/components/dashboard/CoordinatorInboxWidget';

export default function TeachingSupportCoordinatorDashboard() {
  const t = useTranslations('DashboardViews.teachingSupportCoordinator');

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-black tracking-tight text-foreground md:text-3xl">
          {t('title')}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">{t('subtitle')}</p>
      </div>

      <RoleDashboardStats endpoint="/dashboard/teaching-support-coordinator" metrics={[
        { key: 'unreadInbox', title: t('stats.unreadInbox'), description: t('stats.unreadInboxDesc'), icon: ClipboardCheck },
        { key: 'pendingJustifications', title: t('stats.justificationsPending'), description: t('stats.justificationsPendingDesc'), icon: ClipboardCheck },
        { key: 'activeAssignments', title: t('stats.activeAssignments'), description: t('stats.activeAssignmentsDesc'), icon: Users },
        { key: 'activeSchedules', title: t('stats.schedules'), description: t('stats.schedulesDesc'), icon: CalendarDays },
      ]} />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <WidgetCard
            title={t('actionsTitle')}
            subtitle={t('actionsSubtitle')}
          >
            <div className="grid gap-4 sm:grid-cols-3">
              <QuickActionCard
                title={t('actions.createJustification')}
                description={t('actions.createJustificationDesc')}
                href="/dashboard/justifications"
                icon={PlusCircle}
              />
              <QuickActionCard
                title={t('actions.workload')}
                description={t('actions.workloadDesc')}
                href="/dashboard/academic-workload"
                icon={CalendarDays}
              />
              <QuickActionCard
                title={t('actions.assistants')}
                description={t('actions.assistantsDesc')}
                href="/dashboard/academic-information"
                icon={UserCheck}
              />
            </div>
          </WidgetCard>
        </div>

        <div>
          <WidgetCard
            title={t('tasksTitle')}
            subtitle={t('tasksSubtitle')}
          >
            <CoordinatorInboxWidget />
          </WidgetCard>
        </div>
      </div>
    </div>
  );
}
