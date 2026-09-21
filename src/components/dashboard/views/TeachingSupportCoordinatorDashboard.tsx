'use client';

import {
  CalendarDays,
  ClipboardCheck,
  GraduationCap,
  PlusCircle,
  UserCheck,
  Users,
} from 'lucide-react';
import { useTranslations } from 'next-intl';
import StatCard from '@/components/dashboard/widgets/StatCard';
import QuickActionCard from '@/components/dashboard/widgets/QuickActionCard';
import WidgetCard from '@/components/dashboard/widgets/WidgetCard';

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

      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title={t('stats.justificationsPending')}
          value="8"
          description={t('stats.justificationsPendingDesc')}
          icon={ClipboardCheck}
          trend={{ value: t('stats.justificationsPendingTrend'), isPositive: false }}
        />
        <StatCard
          title={t('stats.activeAssistants')}
          value="19"
          description={t('stats.activeAssistantsDesc')}
          icon={Users}
        />
        <StatCard
          title={t('stats.schedules')}
          value="100%"
          description={t('stats.schedulesDesc')}
          icon={CalendarDays}
          trend={{ value: t('stats.schedulesTrend'), isPositive: true }}
        />
        <StatCard
          title={t('stats.titulations')}
          value="14"
          description={t('stats.titulationsDesc')}
          icon={GraduationCap}
        />
      </div>

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
            <div className="space-y-3 text-xs">
              <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-3">
                <span className="font-bold text-amber-600 dark:text-amber-400">
                  {t('tasks.medicalJustificationTitle')}
                </span>
                <p className="mt-1 text-muted-foreground">
                  {t('tasks.medicalJustificationDesc')}
                </p>
              </div>
              <div className="rounded-xl border border-ocean-cyan/30 bg-ocean-cyan/10 p-3">
                <span className="font-bold text-ocean-cyan">
                  {t('tasks.assistantshipConfirmationTitle')}
                </span>
                <p className="mt-1 text-muted-foreground">
                  {t('tasks.assistantshipConfirmationDesc')}
                </p>
              </div>
            </div>
          </WidgetCard>
        </div>
      </div>
    </div>
  );
}
