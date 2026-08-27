import { useTranslations } from 'next-intl';
import AnimeReveal from '@/components/AnimeReveal';

export default function KpiSection() {
  const t = useTranslations('Landing');

  return (
    <section className="px-4 sm:px-6 mb-20 md:mb-28">
      <div className="max-w-[1400px] mx-auto border-t border-border pt-12">
        <AnimeReveal delay={800} direction="up" distance={40} className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center" stagger>
          {[
            { count: "45+", label: t('kpis.teachers') },
            { count: "800+", label: t('kpis.students') },
            { count: "12", label: t('kpis.projects') },
            { count: "150+", label: t('kpis.investigations') }
          ].map((kpi, idx) => (
            <div key={idx} className="flex flex-col items-center group cursor-default">
              <div className="text-4xl md:text-5xl font-extrabold text-foreground mb-2 tracking-tight group-hover:text-primary transition-colors">
                {kpi.count}
              </div>
              <div className="text-xs sm:text-sm text-foreground/50 font-bold uppercase tracking-widest">
                {kpi.label}
              </div>
              <div className="h-1 w-0 bg-primary rounded-full mt-3 transition-all duration-300 group-hover:w-12"></div>
            </div>
          ))}
        </AnimeReveal>
      </div>
    </section>
  );
}
