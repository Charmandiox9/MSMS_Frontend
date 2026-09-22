'use client';

import { useEffect, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import DashboardSidebar from '@/components/dashboard/DashboardSidebar';
import DashboardHeader from '@/components/dashboard/DashboardHeader';
import { ActiveRoleProvider, useActiveRole } from '@/context/ActiveRoleContext';
import { getActiveSession, type ActiveSession } from '@/lib/auth';

function DashboardLayoutContent({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const { activeRole, session } = useActiveRole();

  return (
    <div className="min-h-screen bg-background">
      <DashboardSidebar
        collapsed={collapsed}
        onCollapsedChange={setCollapsed}
        mobileOpen={mobileOpen}
        onMobileOpenChange={setMobileOpen}
        activeRole={activeRole}
        session={session}
      />
      <div
        className={`flex min-h-screen flex-col transition-[margin] duration-300 ${
          collapsed ? 'md:ml-20' : 'md:ml-72'
        }`}
      >
        <DashboardHeader onMenuToggle={() => setMobileOpen(true)} />
        <main className="flex-1 p-5 md:p-8">
          <div className="mx-auto max-w-7xl">{children}</div>
        </main>
      </div>
    </div>
  );
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const locale = useLocale();
  const t = useTranslations('Dashboard');
  const router = useRouter();
  const [session, setSession] = useState<ActiveSession | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    void getActiveSession().then((activeSession) => {
      if (!mounted) return;

      setSession(activeSession);
      setIsLoading(false);

      if (!activeSession) {
        router.replace(`/${locale}/login`);
      }
    });

    return () => {
      mounted = false;
    };
  }, [locale, router]);

  if (isLoading || !session) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background text-sm text-muted-foreground">
        {t('sessionChecking')}
      </div>
    );
  }

  return (
    <ActiveRoleProvider initialSession={session}>
      <DashboardLayoutContent>{children}</DashboardLayoutContent>
    </ActiveRoleProvider>
  );
}
