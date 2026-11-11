import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import TermsDocumentPage from '@/components/legal/TermsDocumentPage';

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'TermsPage' });
  return { title: t('metadata.title'), description: t('metadata.description') };
}

export default function TermsPage() {
  return <TermsDocumentPage />;
}
