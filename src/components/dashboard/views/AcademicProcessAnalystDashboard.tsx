'use client';

import {
  ClipboardCheck,
  FileBarChart,
  FileSpreadsheet,
  GraduationCap,
  TrendingUp,
} from 'lucide-react';
import { useTranslations } from 'next-intl';
import StatCard from '@/components/dashboard/widgets/StatCard';
import QuickActionCard from '@/components/dashboard/widgets/QuickActionCard';
import WidgetCard from '@/components/dashboard/widgets/WidgetCard';

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

      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title={t('stats.progression')}
          value="87.4%"
          description={t('stats.progressionDesc')}
          icon={TrendingUp}
          trend={{ value: t('stats.progressionTrend'), isPositive: true }}
        />
        <StatCard
          title={t('stats.titulation')}
          value="24"
          description={t('stats.titulationDesc')}
          icon={GraduationCap}
        />
        <StatCard
          title={t('stats.reports')}
          value="18"
          description={t('stats.reportsDesc')}
          icon={FileSpreadsheet}
        />
        <StatCard
          title={t('stats.justifications')}
          value="56"
          description={t('stats.justificationsDesc')}
          icon={ClipboardCheck}
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

        <div>
          <WidgetCard
            title={t('distributionTitle')}
            subtitle={t('distributionSubtitle')}
          >
            <div className="space-y-4 text-xs">
              <div>
                <div className="flex justify-between font-semibold text-foreground">
                  <span>{t('degrees.marineBiology')}</span>
                  <span>91%</span>
                </div>
                <div className="mt-1.5 h-2 w-full rounded-full bg-muted">
                  <div className="h-2 rounded-full bg-ocean-cyan" style={{ width: '91%' }} />
                </div>
              </div>
              <div>
                <div className="flex justify-between font-semibold text-foreground">
                  <span>{t('degrees.aquaculture')}</span>
                  <span>84%</span>
                </div>
                <div className="mt-1.5 h-2 w-full rounded-full bg-muted">
                  <div className="h-2 rounded-full bg-ocean-cyan" style={{ width: '84%' }} />
                </div>
              </div>
              <div>
                <div className="flex justify-between font-semibold text-foreground">
                  <span>{t('degrees.riskPrevention')}</span>
                  <span>88%</span>
                </div>
                <div className="mt-1.5 h-2 w-full rounded-full bg-muted">
                  <div className="h-2 rounded-full bg-ocean-cyan" style={{ width: '88%' }} />
                </div>
              </div>
            </div>
          </WidgetCard>
        </div>
      </div>
    </div>
  );
}
