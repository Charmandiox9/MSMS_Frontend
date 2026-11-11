'use client';

import { useEffect, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { getTermsAcceptanceHistory, type TermsAcceptance } from '@/lib/legal-terms';
import { PageSkeleton } from '@/components/ui/LoadingSkeletons';
import { useActiveRole } from '@/context/ActiveRoleContext';

export default function ProfilePage() {
  const t = useTranslations('Profile');
  const locale = useLocale();
  const { session } = useActiveRole();
  const [history, setHistory] = useState<TermsAcceptance[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let active = true;
    void getTermsAcceptanceHistory()
      .then((records) => { if (active) setHistory(records); })
      .catch(() => { if (active) setError(true); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  if (loading) return <PageSkeleton label={t('loading')} />;

  return (
    <div className="space-y-8">
      <header className="space-y-2">
        <p className="text-sm font-semibold uppercase tracking-wide text-primary">{t('eyebrow')}</p>
        <h1 className="text-3xl font-bold tracking-tight">{t('title')}</h1>
        <p className="max-w-2xl text-muted-foreground">{t('description')}</p>
      </header>

      <section aria-labelledby="profile-account" className="rounded-2xl border border-border bg-card p-6">
        <h2 id="profile-account" className="text-lg font-semibold">{t('account')}</h2>
        <p className="mt-2 text-muted-foreground">{session?.email}</p>
      </section>

      <section aria-labelledby="terms-history" className="space-y-4">
        <div>
          <h2 id="terms-history" className="text-xl font-semibold">{t('historyTitle')}</h2>
          <p className="mt-1 text-sm text-muted-foreground">{t('historyDescription')}</p>
        </div>
        {error ? <p role="alert" className="rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-sm">{t('historyError')}</p> : history.length === 0 ? (
          <p className="rounded-xl border border-border bg-card p-5 text-sm text-muted-foreground">{t('empty')}</p>
        ) : (
          <ol className="space-y-3">
            {history.map((item) => (
              <li key={`${item.version}-${item.acceptedAt}`} className="rounded-2xl border border-border bg-card p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h3 className="font-semibold">{t('termsVersion', { version: item.version })}</h3>
                    <p className="mt-1 text-sm text-muted-foreground">{t('acceptedAt', { date: new Intl.DateTimeFormat(locale, { dateStyle: 'long', timeStyle: 'short' }).format(new Date(item.acceptedAt)) })}</p>
                    <p className="mt-1 text-xs text-muted-foreground">{t('acceptedLanguage', { language: item.locale.toUpperCase() })}</p>
                  </div>
                </div>
                <details className="mt-4 rounded-xl bg-muted p-4">
                  <summary className="cursor-pointer text-sm font-medium text-primary">{t('viewTerms')}</summary>
                  <div className="mt-4 space-y-5">
                    <p className="text-sm leading-6 text-muted-foreground">{item.contentSnapshot.notice}</p>
                    {item.contentSnapshot.sections.map((section) => (
                      <section key={section.heading} className="space-y-2">
                        <h4 className="text-sm font-semibold">{section.heading}</h4>
                        {section.paragraphs.map((paragraph) => <p key={paragraph} className="max-w-prose text-sm leading-6 text-muted-foreground">{paragraph}</p>)}
                      </section>
                    ))}
                  </div>
                </details>
                <p className="mt-3 break-all font-mono text-xs text-muted-foreground">{t('recordHash', { hash: item.contentHash })}</p>
              </li>
            ))}
          </ol>
        )}
      </section>
    </div>
  );
}
