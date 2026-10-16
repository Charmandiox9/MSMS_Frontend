'use client';

import { Menu } from 'lucide-react';
import { useTranslations } from 'next-intl';
import Breadcrumbs from '@/components/ui/Breadcrumbs';
import RoleSwitcher from '@/components/dashboard/RoleSwitcher';

interface DashboardHeaderProps {
  onMenuToggle: () => void;
  rightSlot?: React.ReactNode;
}

export default function DashboardHeader({
  onMenuToggle,
  rightSlot,
}: DashboardHeaderProps) {
  const tNav = useTranslations('DashboardNav');

  return (
    <header
      role="banner"
      className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-border bg-card/85 px-4 backdrop-blur-md transition-colors md:px-8"
    >
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onMenuToggle}
          className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-border bg-muted/60 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ocean-cyan md:hidden"
          aria-label={tNav('openMenu')}
        >
          <Menu className="h-5 w-5" />
        </button>
        <Breadcrumbs />
      </div>

      <div className="flex items-center gap-3">
        <RoleSwitcher />
        {rightSlot}
      </div>
    </header>
  );
}
