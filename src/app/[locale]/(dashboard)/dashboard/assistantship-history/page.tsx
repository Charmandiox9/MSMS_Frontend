import { CalendarDays, ClipboardList, Search, UsersRound } from 'lucide-react';
import { useTranslations } from 'next-intl';

export default function AssistantshipHistoryPage() {
  const t = useTranslations('AssistantshipHistoryPage');

  return (
    <section className="space-y-6">
      <div>
        <p className="text-xs font-black uppercase tracking-[0.18em] text-primary">{t('eyebrow')}</p>
        <h1 className="mt-2 text-3xl font-black tracking-tight text-foreground">{t('title')}</h1>
        <p className="mt-2 max-w-3xl text-sm text-muted-foreground">{t('subtitle')}</p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <article className="rounded-3xl border border-border bg-card p-5 shadow-sm"><div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/10 text-primary"><UsersRound className="h-5 w-5" /></div><p className="mt-5 text-sm text-muted-foreground">{t('stats.assistants')}</p><p className="mt-1 text-3xl font-black text-foreground">—</p></article>
        <article className="rounded-3xl border border-border bg-card p-5 shadow-sm"><div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-ocean-cyan/10 text-ocean-cyan"><CalendarDays className="h-5 w-5" /></div><p className="mt-5 text-sm text-muted-foreground">{t('stats.semesters')}</p><p className="mt-1 text-3xl font-black text-foreground">—</p></article>
        <article className="rounded-3xl border border-border bg-card p-5 shadow-sm"><div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-ucn-gold/10 text-ucn-gold"><ClipboardList className="h-5 w-5" /></div><p className="mt-5 text-sm text-muted-foreground">{t('stats.records')}</p><p className="mt-1 text-3xl font-black text-foreground">—</p></article>
      </div>

      <div className="rounded-3xl border border-border bg-card p-5 shadow-sm md:p-6">
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
          <div><h2 className="text-lg font-black text-foreground">{t('history.title')}</h2><p className="mt-1 text-sm text-muted-foreground">{t('history.subtitle')}</p></div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <label className="relative block"><span className="sr-only">{t('filters.search')}</span><Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><input type="search" placeholder={t('filters.search')} className="h-10 w-full rounded-xl border border-border bg-background pl-9 pr-3 text-sm text-foreground outline-none transition focus:border-primary sm:w-56" /></label>
            <label><span className="sr-only">{t('filters.semester')}</span><select className="h-10 w-full rounded-xl border border-border bg-background px-3 text-sm text-foreground outline-none focus:border-primary sm:w-44" defaultValue="all"><option value="all">{t('filters.allSemesters')}</option></select></label>
          </div>
        </div>
        <div className="mt-6 rounded-2xl border border-dashed border-border px-4 py-14 text-center"><ClipboardList className="mx-auto h-8 w-8 text-muted-foreground/70" /><p className="mt-4 text-sm font-semibold text-foreground">{t('history.empty')}</p><p className="mx-auto mt-2 max-w-lg text-xs text-muted-foreground">{t('history.emptyDescription')}</p></div>
      </div>
    </section>
  );
}
