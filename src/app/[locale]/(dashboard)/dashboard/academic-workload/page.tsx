'use client';

import { CalendarDays } from 'lucide-react';
import { useTranslations } from 'next-intl';
import UnderDevelopmentPlaceholder from '@/components/dashboard/UnderDevelopmentPlaceholder';

export default function AcademicWorkloadPage() {
  const t = useTranslations('DashboardNav');

  return (
    <UnderDevelopmentPlaceholder
      moduleTitle={t('academicWorkload')}
      icon={CalendarDays}
    />
  );
}
