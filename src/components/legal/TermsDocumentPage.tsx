'use client';

import { useEffect, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { getCurrentTerms, type TermsDocument } from '@/lib/legal-terms';
import { PageSkeleton } from '@/components/ui/LoadingSkeletons';
import PublicPageToolbar from '@/components/layout/PublicPageToolbar';

export default function TermsDocumentPage() {
  const locale = useLocale();
  const t = useTranslations('TermsPage');
  const [document, setDocument] = useState<TermsDocument | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    let active = true;
    void getCurrentTerms(locale)
      .then((result) => { if (active) setDocument(result); })
      .catch(() => { if (active) setError(true); });
    return () => { active = false; };
  }, [locale]);

  if (!document && !error) return <PageSkeleton label={t('loading')} />;

  return (
    <main className="w-full px-5 py-8 sm:px-8 sm:py-10">
      <PublicPageToolbar backLabel={t('back')} />
      <article className="mx-auto max-w-5xl space-y-10 pb-8">
        <header className="max-w-3xl space-y-4">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">MARSYS</p>
          <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">{document?.title ?? t('metadata.title')}</h1>
          {document && <p className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-5 text-sm leading-6 text-foreground">{document.notice}</p>}
          {document && <p className="text-sm text-muted-foreground">{t('version', { version: document.version })}</p>}
        </header>

        {error ? <p role="alert" className="rounded-2xl border border-destructive/30 bg-destructive/5 p-5 text-sm">{t('error')}</p> : (
          <div className="grid gap-4 md:grid-cols-2">
            {document?.sections.map((section) => (
              <section key={section.heading} className="rounded-2xl border border-border bg-card p-5 sm:p-6">
                <h2 className="text-base font-semibold text-card-foreground">{section.heading}</h2>
                {section.paragraphs.map((paragraph) => <p key={paragraph} className="mt-3 max-w-prose text-sm leading-6 text-muted-foreground">{paragraph}</p>)}
              </section>
            ))}
          </div>
        )}

      </article>
    </main>
  );
}
