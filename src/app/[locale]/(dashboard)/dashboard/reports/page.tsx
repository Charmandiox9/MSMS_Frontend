'use client';

import { FileBarChart } from 'lucide-react';
import { useTranslations } from 'next-intl';
import UnderDevelopmentPlaceholder from '@/components/dashboard/UnderDevelopmentPlaceholder';

export default function ReportsPage() {
  const t = useTranslations('DashboardNav');

  return (
    <UnderDevelopmentPlaceholder
      moduleTitle={t('reports')}
      icon={FileBarChart}
    />
  );
}
