'use client';

import { BookOpenCheck } from 'lucide-react';
import { useTranslations } from 'next-intl';
import UnderDevelopmentPlaceholder from '@/components/dashboard/UnderDevelopmentPlaceholder';

export default function AcademicInformationPage() {
  const t = useTranslations('DashboardNav');

  return (
    <UnderDevelopmentPlaceholder
      moduleTitle={t('academicInformation')}
      icon={BookOpenCheck}
    />
  );
}
