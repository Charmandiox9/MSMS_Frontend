import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/routing';
import { ArrowRight } from 'lucide-react';
import Hero3D from '@/components/landing/Hero3D';
import AnimeReveal from '@/components/landing/AnimeReveal';

export default function HeroSection() {
  const t = useTranslations('Landing');

  return (
    <section className="relative w-full overflow-hidden flex items-center min-h-[90vh] pt-16">
      <div className="pointer-events-none absolute inset-0 z-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-primary/10 via-transparent to-transparent opacity-70"></div>

      {/* The 3D Canvas Full Screen Background */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <Hero3D />
      </div>

      {/* Contenedor principal alineado con el layout de la página */}
      <div className="container mx-auto px-6 relative z-10 pointer-events-none">
        
        {/* Left Column: Text & CTA restringido a la mitad del contenedor */}
        <div className="w-full lg:w-[55%] xl:w-[50%] flex flex-col gap-8 pointer-events-auto">
          <AnimeReveal>
            <div className="inline-flex w-fit items-center gap-2 rounded-full border border-border bg-card/80 px-3 py-1 text-foreground shadow-sm">
              <span className="size-2 rounded-full bg-primary" aria-hidden="true"></span>
              <span className="text-sm font-medium text-foreground">{t('badge')}</span>
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
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-primary px-8 py-3 text-sm font-semibold text-primary-foreground shadow-sm transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2 focus-visible:ring-offset-background"
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
