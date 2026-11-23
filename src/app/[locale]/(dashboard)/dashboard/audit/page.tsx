import { getTranslations } from 'next-intl/server';
import DashboardPageHeader from '@/components/dashboard/DashboardPageHeader';
import SystemAuditLog from './SystemAuditLog';

export default async function AuditPage() {
  const t = await getTranslations('SystemAudit');
  return (
    <div className="space-y-6">
      <DashboardPageHeader title={t('title')} subtitle={t('description')} />
      <SystemAuditLog />
    </div>
  );
}
