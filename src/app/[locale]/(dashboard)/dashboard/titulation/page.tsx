'use client';

import { GraduationCap } from 'lucide-react';
import { useTranslations } from 'next-intl';
import UnderDevelopmentPlaceholder from '@/components/dashboard/UnderDevelopmentPlaceholder';

export default function TitulationPage() {
  const t = useTranslations('DashboardNav');

  return (
    <UnderDevelopmentPlaceholder
      moduleTitle={t('titulation')}
      icon={GraduationCap}
    />
  );
}
