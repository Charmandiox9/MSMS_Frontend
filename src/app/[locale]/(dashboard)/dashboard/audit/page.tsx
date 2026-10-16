'use client';

import { ShieldCheck } from 'lucide-react';
import { useTranslations } from 'next-intl';
import UnderDevelopmentPlaceholder from '@/components/dashboard/UnderDevelopmentPlaceholder';

export default function AuditPage() {
  const t = useTranslations('DashboardNav');

  return (
    <UnderDevelopmentPlaceholder
      moduleTitle={t('audit')}
      icon={ShieldCheck}
    />
  );
}
