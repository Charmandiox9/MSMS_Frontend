'use client';

import {
  BookOpenCheck,
  ClipboardList,
  FileSpreadsheet,
  GraduationCap,
  Users,
} from 'lucide-react';
import { useTranslations } from 'next-intl';
import StatCard from '@/components/dashboard/widgets/StatCard';
import QuickActionCard from '@/components/dashboard/widgets/QuickActionCard';
import WidgetCard from '@/components/dashboard/widgets/WidgetCard';

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

      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title={t('stats.records')}
          value="342"
          description={t('stats.recordsDesc')}
          icon={BookOpenCheck}
          trend={{ value: t('stats.recordsTrend'), isPositive: true }}
        />
        <StatCard
          title={t('stats.pending')}
          value="12"
          description={t('stats.pendingDesc')}
          icon={ClipboardList}
          trend={{ value: t('stats.pendingTrend'), isPositive: false }}
        />
        <StatCard
          title={t('stats.certificates')}
          value="89"
          description={t('stats.certificatesDesc')}
          icon={GraduationCap}
        />
        <StatCard
          title={t('stats.faculty')}
          value="36"
          description={t('stats.facultyDesc')}
          icon={Users}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
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

        <div>
          <WidgetCard
            title={t('noticesTitle')}
            subtitle={t('noticesSubtitle')}
          >
            <div className="space-y-3">
              <div className="rounded-xl border border-border bg-muted/40 p-3 text-xs">
                <p className="font-bold text-foreground">{t('notices.gradesCloseTitle')}</p>
                <p className="mt-1 text-muted-foreground">{t('notices.gradesCloseDesc')}</p>
              </div>
              <div className="rounded-xl border border-border bg-muted/40 p-3 text-xs">
                <p className="font-bold text-foreground">{t('notices.filesValidationTitle')}</p>
                <p className="mt-1 text-muted-foreground">{t('notices.filesValidationDesc')}</p>
              </div>
            </div>
          </WidgetCard>
        </div>
      </div>
    </div>
  );
}
