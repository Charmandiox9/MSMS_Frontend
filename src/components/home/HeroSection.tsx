import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/routing';
import { ArrowRight, GraduationCap, Car, FileText } from 'lucide-react';
import Hero3D from '@/components/Hero3D';
import AnimeReveal from '@/components/AnimeReveal';

export default function HeroSection() {
  const t = useTranslations('Landing');

  return (
    <section className="relative w-full overflow-hidden flex items-center min-h-[90vh] pt-16">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-ocean-cyan/10 via-transparent to-transparent opacity-50 dark:opacity-20 pointer-events-none z-0"></div>

      {/* The 3D Canvas Full Screen Background */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <Hero3D />
      </div>

      {/* Tarjetas informativas pegadas al borde derecho absoluto de la pantalla */}
      <div className="hidden lg:flex absolute right-4 xl:right-12 top-1/2 -translate-y-1/2 flex-col gap-4 w-[320px] xl:w-[360px] z-10 pointer-events-auto">
        
        {/* Card 1: Investigación */}
        <div className="w-full bg-slate-900/70 dark:bg-slate-900/80 backdrop-blur-2xl border border-white/10 p-5 rounded-2xl shadow-2xl animate-float" style={{ animationDelay: '0ms' }}>
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 rounded-full bg-ocean-cyan/20 flex items-center justify-center text-ocean-cyan"><FileText className="w-4 h-4" /></div>
            <div>
              <h3 className="text-sm font-bold text-white">{t('heroCards.research.title')}</h3>
              <p className="text-[10px] text-white/50">{t('heroCards.research.subtitle')}</p>
            </div>
          </div>
          <div className="text-4xl font-black text-ocean-cyan mb-1 drop-shadow-[0_0_10px_rgba(14,165,233,0.5)]">{t('heroCards.research.stat')}</div>
          <div className="text-[11px] font-medium text-white/80">{t('heroCards.research.statLabel')}</div>
          <div className="mt-3 h-1.5 w-full bg-white/10 rounded-full overflow-hidden shadow-[0_0_10px_rgba(14,165,233,0.2)]">
            <div className="h-full bg-ocean-cyan w-[85%] rounded-full shadow-[0_0_10px_rgba(14,165,233,0.8)]"></div>
          </div>
        </div>

        {/* Card 2: Academia */}
        <div className="w-full bg-slate-800/80 dark:bg-slate-800/90 backdrop-blur-3xl border border-white/20 p-5 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] z-20 animate-float" style={{ animationDelay: '1000ms' }}>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-ucn-gold/20 flex items-center justify-center text-ucn-gold"><GraduationCap className="w-4 h-4" /></div>
              <h3 className="text-sm font-bold text-white">{t('heroCards.community.title')}</h3>
            </div>
            <span className="px-2 py-1 bg-green-500/20 border border-green-500/30 text-green-400 text-[9px] font-bold rounded-full drop-shadow-[0_0_5px_rgba(74,222,128,0.5)]">{t('heroCards.community.status')}</span>
          </div>
          
          <div className="flex gap-4 mb-4">
            <div className="flex-1 bg-slate-900/50 rounded-xl p-3 border border-white/5">
              <div className="text-[10px] text-white/50 mb-1">{t('heroCards.community.teachers')}</div>
              <div className="text-xl font-black text-white">42</div>
            </div>
            <div className="flex-1 bg-slate-900/50 rounded-xl p-3 border border-white/5">
              <div className="text-[10px] text-white/50 mb-1">{t('heroCards.community.projects')}</div>
              <div className="text-xl font-black text-white">124</div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex -space-x-2">
              <div className="w-8 h-8 rounded-full bg-coral-red border-2 border-slate-800"></div>
              <div className="w-8 h-8 rounded-full bg-ucn-gold border-2 border-slate-800"></div>
              <div className="w-8 h-8 rounded-full bg-green-400 border-2 border-slate-800"></div>
              <div className="w-8 h-8 rounded-full bg-ocean-cyan border-2 border-slate-800 flex items-center justify-center text-[9px] font-bold text-white drop-shadow-[0_0_8px_rgba(14,165,233,0.8)]">+500</div>
            </div>
          </div>
        </div>

        {/* Card 3: Logística */}
        <div className="w-full bg-slate-900/70 dark:bg-slate-900/80 backdrop-blur-2xl border border-white/10 p-5 rounded-2xl shadow-xl z-10 animate-float" style={{ animationDelay: '2000ms' }}>
          <div className="flex items-center gap-2 mb-3">
            <div className="w-6 h-6 rounded-md bg-purple-500/20 flex items-center justify-center text-purple-400"><Car className="w-3 h-3" /></div>
            <h3 className="text-xs font-bold text-white">{t('heroCards.logistics.title')}</h3>
          </div>
          
          <div className="space-y-2">
            <div className="p-2 bg-white/5 rounded-lg border border-white/5 flex justify-between items-center">
              <div className="flex flex-col">
                <span className="text-[10px] font-bold text-white">{t('heroCards.logistics.fieldTrip')}</span>
                <span className="text-[8px] text-white/50">{t('heroCards.logistics.fieldTripDest')}</span>
              </div>
              <div className="w-1.5 h-1.5 rounded-full bg-green-500 drop-shadow-[0_0_5px_rgba(74,222,128,0.8)]"></div>
            </div>
            <div className="p-2 bg-white/5 rounded-lg border border-white/5 flex justify-between items-center">
              <div className="flex flex-col">
                <span className="text-[10px] font-bold text-white">{t('heroCards.logistics.lab')}</span>
                <span className="text-[8px] text-white/50">{t('heroCards.logistics.labTime')}</span>
              </div>
              <div className="w-1.5 h-1.5 rounded-full bg-ucn-gold drop-shadow-[0_0_5px_rgba(245,158,11,0.8)]"></div>
            </div>
          </div>
        </div>
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
