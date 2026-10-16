import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/routing';
import { ArrowRight } from 'lucide-react';
import Hero3D from '@/components/landing/Hero3D';
import AnimeReveal from '@/components/landing/AnimeReveal';

export default function HeroSection() {
  const t = useTranslations('Landing');

  return (
    <section className="relative w-full overflow-hidden flex items-center min-h-[90vh] pt-16">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-ocean-cyan/10 via-transparent to-transparent opacity-50 dark:opacity-20 pointer-events-none z-0"></div>

      {/* The 3D Canvas Full Screen Background */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <Hero3D />
      </div>

      {/* Contenedor principal alineado con el layout de la página */}
      <div className="container mx-auto px-6 relative z-10 pointer-events-none">
        
        {/* Left Column: Text & CTA restringido a la mitad del contenedor */}
        <div className="w-full lg:w-[55%] xl:w-[50%] flex flex-col gap-8 pointer-events-auto">
          <AnimeReveal>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-ucn-navy/5 dark:bg-white/5 border border-ucn-navy/10 dark:border-white/10 w-fit">
              <span className="w-2 h-2 rounded-full bg-ocean-cyan animate-pulse"></span>
              <span className="text-xs font-medium text-foreground/80">{t('badge')}</span>
            </div>
          </AnimeReveal>

          <AnimeReveal delay={100}>
            <h1 className="text-4xl lg:text-6xl font-black tracking-tight text-foreground leading-[1.1]">
              {t('title_part1')} <br />
              <span className="text-primary">{t('title_part2')}</span>
            </h1>
          </AnimeReveal>

          <AnimeReveal delay={200}>
            <p className="text-lg lg:text-xl text-muted-foreground max-w-2xl leading-relaxed">
              {t('description')}
            </p>
          </AnimeReveal>

          <AnimeReveal delay={300}>
            <div className="flex flex-col sm:flex-row gap-4 pt-4">
              <Link 
                href="/login" 
                className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl bg-ocean-cyan hover:bg-ocean-cyan/90 text-white font-bold transition-all shadow-lg shadow-ocean-cyan/20 hover:shadow-ocean-cyan/40 hover:-translate-y-0.5"
              >
                {t('explore_fcm')} <ArrowRight className="w-5 h-5" />
              </Link>
            </div>
          </AnimeReveal>
        </div>
      </div>
    </section>
  );
}
