import { useTranslations } from 'next-intl';
import { Building2, Waves, Laptop, ExternalLink, BookOpen } from 'lucide-react';

export default function FCMPage() {
  const t = useTranslations('FCM');

  return (
    <div className="min-h-screen flex flex-col bg-background overflow-x-hidden selection:bg-ocean-cyan/20">
      
      <section className="relative py-24 px-6 overflow-hidden border-b border-border/50">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-ocean-cyan/15 via-transparent to-transparent pointer-events-none z-0"></div>
        <div className="max-w-[1400px] mx-auto text-center relative z-10 flex flex-col items-center">
          <div className="mb-6 flex items-center justify-center gap-2 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <span className="text-xs font-bold uppercase tracking-widest text-ocean-cyan bg-ocean-cyan/10 px-4 py-1.5 rounded-full border border-ocean-cyan/20 shadow-sm">
              MARSYS · FCM
            </span>
          </div>
          <h1 className="text-5xl md:text-6xl font-black mb-6 tracking-tight text-foreground animate-in fade-in slide-in-from-bottom-4 duration-700 delay-100">
            {t('title')}
          </h1>
          <p className="text-muted-foreground text-lg md:text-xl font-medium max-w-2xl mx-auto leading-relaxed animate-in fade-in slide-in-from-bottom-4 duration-700 delay-200">
            {t('subtitle')}
          </p>
        </div>
      </section>

      <main className="flex-grow max-w-[1200px] mx-auto w-full px-6 py-16 space-y-24">
        
        <section className="bg-card/50 backdrop-blur-sm border border-border/50 p-8 md:p-12 rounded-[2rem] shadow-sm hover:shadow-xl hover:border-ocean-cyan/30 hover:bg-card transition-all duration-300 max-w-4xl mx-auto text-center animate-in fade-in duration-700 delay-300">
          <h2 className="text-3xl md:text-4xl font-black text-foreground mb-6 tracking-tight">{t('whoAreWe')}</h2>
          <p className="text-muted-foreground leading-relaxed text-lg font-medium">
            {t('whoAreWeDesc')}
          </p>
        </section>

        <section>
          <h2 className="text-3xl font-bold text-foreground mb-8 text-center">{t('links')}</h2>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { id: 'ucn', url: 'https://www.ucn.cl', icon: Building2, color: 'text-ocean-cyan', bg: 'bg-ocean-cyan/10' },
              { id: 'fcm', url: 'https://www.ucn.cl/universidad/facultades-escuelas-y-departamentos/facultad-de-ciencias-del-mar/', icon: Waves, color: 'text-ucn-gold', bg: 'bg-ucn-gold/10' },
              { id: 'campus', url: 'https://campusvirtual.ucn.cl', icon: Laptop, color: 'text-purple-500', bg: 'bg-purple-500/10' }
            ].map((link, idx) => {
              const Icon = link.icon;
              return (
                <a key={idx} href={link.url} target="_blank" rel="noopener noreferrer" className="group flex flex-col items-center justify-center p-8 bg-card/50 backdrop-blur-sm border border-border/50 rounded-[2rem] shadow-sm hover:shadow-xl hover:-translate-y-1 hover:border-ocean-cyan/30 hover:bg-card transition-all duration-300">
                  <div className={`w-16 h-16 rounded-[1rem] mb-5 flex items-center justify-center transition-transform duration-300 ${link.bg} ${link.color} group-hover:scale-110`}>
                    <Icon className="w-8 h-8" />
                  </div>
                  <span className="font-bold text-foreground text-xl mb-2 text-center transition-colors group-hover:text-ocean-cyan">{t(`linksCards.${link.id}.title`)}</span>
                  <div className="flex items-center text-sm font-medium text-foreground/50 group-hover:text-ocean-cyan transition-colors">
                    <span>{t(`linksCards.${link.id}.desc`)}</span>
                    <ExternalLink className="w-4 h-4 ml-1 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
                  </div>
                </a>
              );
            })}
          </div>
        </section>

        <section className="pb-12">
          <h2 className="text-3xl font-bold text-foreground mb-8 text-center">{t('careers')}</h2>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { id: 'biologia', url: 'https://www.ucn.cl/universidad/facultades-escuelas-y-departamentos/facultad-de-ciencias-del-mar/departamento-de-biologia-marina/' },
              { id: 'acuicultura', url: 'https://www.ucn.cl/universidad/facultades-escuelas-y-departamentos/facultad-de-ciencias-del-mar/departamento-de-acuicultura/' },
              { id: 'prevencion', url: 'https://www.ucn.cl/universidad/facultades-escuelas-y-departamentos/facultad-de-ciencias-del-mar/escuela-de-prevencion-de-riesgo-y-medio-ambiente/' }
            ].map((career, idx) => (
              <a key={idx} href={career.url} target="_blank" rel="noopener noreferrer" className="flex flex-col p-8 bg-card/50 backdrop-blur-sm border border-border/50 rounded-[2rem] shadow-sm hover:shadow-xl hover:border-ocean-cyan/30 hover:bg-card hover:-translate-y-1 transition-all duration-300 group h-full focus-visible:ring-2 focus-visible:outline-none focus:ring-ocean-cyan">
                <div className="bg-ocean-cyan/10 text-ocean-cyan p-4 rounded-xl mb-6 self-start transform group-hover:-rotate-6 transition-transform">
                  <BookOpen className="w-8 h-8" />
                </div>
                <div className="flex-grow flex flex-col justify-between">
                  <h3 className="font-bold text-xl text-foreground leading-tight group-hover:text-ocean-cyan transition-colors mb-6">
                    {t(`careersCards.${career.id}.title`)}
                  </h3>
                  <div className="flex justify-between items-center text-sm font-bold text-ocean-cyan opacity-80 group-hover:opacity-100 transition-opacity">
                    <span>{t(`careersCards.${career.id}.desc`)}</span>
                    <ExternalLink className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              </a>
            ))}
          </div>
        </section>

      </main>
    </div>
  );
}
