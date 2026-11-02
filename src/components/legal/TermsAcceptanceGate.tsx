'use client';

import { useEffect, useState, type ReactNode } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { acceptCurrentTerms, getCurrentTerms, getTermsStatus, type TermsDocument } from '@/lib/legal-terms';
import { DashboardShellSkeleton } from '@/components/ui/LoadingSkeletons';
import { Link, useRouter } from '@/i18n/routing';
import { logout } from '@/lib/auth';

export default function TermsAcceptanceGate({ children }: { children: ReactNode }) {
  const locale = useLocale();
  const router = useRouter();
  const t = useTranslations('TermsAcceptance');
  const [document, setDocument] = useState<TermsDocument | null>(null);
  const [required, setRequired] = useState(false);
  const [checked, setChecked] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(false);

  const loadStatus = async () => {
    setLoading(true);
    setError(false);
    try {
      const status = await getTermsStatus();
      if (status.accepted) {
        setRequired(false);
        setLoading(false);
        return;
      }
      const current = await getCurrentTerms(locale);
      setDocument(current);
      setRequired(true);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  const handleExit = async () => {
    await logout().catch(() => undefined);
    router.replace('/login');
    router.refresh();
  };

  useEffect(() => {
    void loadStatus();
  }, [locale]);

  const handleAccept = async () => {
    if (!document || !checked) return;
    setSaving(true);
    setError(false);
    try {
      await acceptCurrentTerms(document.version, locale);
      setRequired(false);
    } catch {
      setError(true);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <DashboardShellSkeleton label={t('loading')} />;
  if (error && !document) {
    return (
      <main className="mx-auto flex min-h-screen max-w-xl flex-col justify-center gap-5 px-6">
        <h1 className="text-2xl font-bold text-foreground">{t('loadErrorTitle')}</h1>
        <p className="text-muted-foreground">{t('loadError')}</p>
        <div className="flex flex-wrap items-center gap-3">
          <button type="button" onClick={() => void loadStatus()} className="w-fit rounded-xl bg-primary px-5 py-3 font-semibold text-primary-foreground">{t('retry')}</button>
          <button type="button" onClick={() => void handleExit()} className="w-fit rounded-xl border border-border px-5 py-3 font-semibold text-foreground">{t('logout')}</button>
          <Link href="/privacy" className="text-sm font-medium text-primary underline underline-offset-4">{t('privacyLink')}</Link>
        </div>
      </main>
    );
  }
  if (!required || !document) return <>{children}</>;

  return (
    <main className="min-h-screen bg-background px-4 py-10 text-foreground sm:px-6">
      <article className="mx-auto max-w-3xl space-y-8 rounded-3xl border border-border bg-card p-6 shadow-sm sm:p-10">
        <header className="space-y-3">
          <p className="text-sm font-semibold uppercase tracking-wide text-primary">{t('eyebrow')}</p>
          <h1 className="text-3xl font-bold tracking-tight">{document.title}</h1>
          <p className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 text-sm leading-6 text-foreground">{document.notice}</p>
          <p className="text-sm text-muted-foreground">{t('version', { version: document.version })}</p>
        </header>

        <div className="space-y-6">
          {document.sections.map((section) => (
            <section key={section.heading} className="space-y-2">
              <h2 className="text-lg font-semibold">{section.heading}</h2>
              {section.paragraphs.map((paragraph) => <p key={paragraph} className="max-w-prose leading-7 text-muted-foreground">{paragraph}</p>)}
            </section>
          ))}
        </div>

        <div className="space-y-5 border-t border-border pt-6">
          <label className="flex cursor-pointer items-start gap-3 text-sm leading-6">
            <input type="checkbox" checked={checked} onChange={(event) => setChecked(event.target.checked)} className="mt-1 h-4 w-4 accent-primary" />
            <span>{t('confirmation')}</span>
          </label>
          <p className="text-sm text-muted-foreground">{t('privacySeparate')} <Link href="/privacy" className="font-medium text-primary underline underline-offset-4">{t('privacyLink')}</Link></p>
          {error && <p role="alert" className="text-sm font-medium text-destructive">{t('saveError')}</p>}
          <button type="button" disabled={!checked || saving} onClick={() => void handleAccept()} className="rounded-xl bg-primary px-5 py-3 font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50">
            {saving ? t('saving') : t('accept')}
          </button>
        </div>
      </article>
    </main>
  );
}
