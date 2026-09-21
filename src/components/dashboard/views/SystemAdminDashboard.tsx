'use client';

import {
  FileCheck,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Sliders,
  UserCheck,
  Users,
} from 'lucide-react';
import { useTranslations } from 'next-intl';
import StatCard from '@/components/dashboard/widgets/StatCard';
import QuickActionCard from '@/components/dashboard/widgets/QuickActionCard';
import WidgetCard from '@/components/dashboard/widgets/WidgetCard';
import { Link } from '@/i18n/routing';

export default function SystemAdminDashboard() {
  const t = useTranslations('DashboardViews.systemAdmin');

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
          title={t('stats.users')}
          value="48"
          description={t('stats.usersDesc')}
          icon={Users}
          trend={{ value: t('stats.usersTrend'), isPositive: true }}
        />
        <StatCard
          title={t('stats.roles')}
          value="4"
          description={t('stats.rolesDesc')}
          icon={Shield}
        />
        <StatCard
          title={t('stats.audit')}
          value="1,280"
          description={t('stats.auditDesc')}
          icon={FileCheck}
          trend={{ value: t('stats.auditTrend'), isPositive: true }}
        />
        <StatCard
          title={t('stats.compliance')}
          value="100%"
          description={t('stats.complianceDesc')}
          icon={ShieldCheck}
          trend={{ value: t('stats.complianceTrend'), isPositive: true }}
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
                title={t('actions.manageUsers')}
                description={t('actions.manageUsersDesc')}
                href="/dashboard/users"
                icon={UserCheck}
              />
              <QuickActionCard
                title={t('actions.auditLogs')}
                description={t('actions.auditLogsDesc')}
                href="/dashboard/audit"
                icon={FileCheck}
              />
              <QuickActionCard
                title={t('actions.systemSettings')}
                description={t('actions.systemSettingsDesc')}
                href="/dashboard/settings"
                icon={Sliders}
              />
            </div>
          </WidgetCard>
        </div>

        <div>
          <div className="rounded-2xl border border-ocean-cyan/35 bg-gradient-to-br from-ocean-cyan/10 via-card to-card p-6 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-ocean-cyan/20 text-ocean-cyan">
                <ShieldAlert className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-foreground">
                  {t('law21719.title')}
                </h3>
                <span className="inline-block rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] font-bold text-emerald-500">
                  {t('law21719.status')}
                </span>
              </div>
            </div>
            <p className="mt-4 text-xs leading-relaxed text-muted-foreground">
              {t('law21719.statusDesc')}
            </p>
            <div className="mt-5 border-t border-border/60 pt-4">
              <Link
                href="/privacy"
                className="inline-flex items-center text-xs font-semibold text-ocean-cyan hover:underline"
              >
                {t('law21719.viewPolicy')} &rarr;
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
