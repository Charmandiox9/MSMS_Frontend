'use client';

import { useState } from 'react';
import DashboardSidebar from '@/components/dashboard/DashboardSidebar';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#020b18]">
      <DashboardSidebar collapsed={collapsed} onCollapsedChange={setCollapsed} />
      <main className={`min-h-screen pt-16 transition-[margin] duration-300 md:pt-0 ${collapsed ? 'md:ml-24' : 'md:ml-80'}`}>
        <div className="mx-auto max-w-7xl p-5 md:p-8">{children}</div>
      </main>
    </div>
  );
}
