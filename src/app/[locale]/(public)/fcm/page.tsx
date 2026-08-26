import { useTranslations } from 'next-intl';
import { Building2, Waves, Laptop, ExternalLink, BookOpen } from 'lucide-react';

export default function FCMPage() {
  const t = useTranslations('FCM');

  return (
    <div className="min-h-screen flex flex-col bg-background overflow-x-hidden selection:bg-primary/20">
      
      {/* HERO SECTION */}
      <section className="bg-muted relative py-20 px-6 overflow-hidden">
        <div className="absolute top-0 inset-x-0 h-full bg-gradient-to-b from-primary/5 to-transparent pointer-events-none"></div>
        <div className="max-w-[1400px] mx-auto text-center relative z-10 flex flex-col items-center">
          <div className="mb-6 flex items-center justify-center gap-2">
            <span className="text-xs font-bold uppercase tracking-widest text-primary bg-primary/10 px-4 py-1.5 rounded-full border border-primary/20 shadow-sm">
              MARSYS · FCM
            </span>
          </div>
          <h1 className="text-5xl md:text-6xl font-black mb-6 tracking-tight text-foreground">
            {t('title')}
          </h1>
          <p className="text-muted-foreground text-lg md:text-xl font-medium max-w-2xl mx-auto leading-relaxed">
            {t('subtitle')}
          </p>
        </div>
      </section>

      <main className="flex-grow max-w-[1200px] mx-auto w-full px-6 py-16 space-y-24">
        
        {/* WHO ARE WE? */}
        <section className="bg-card border border-border p-8 md:p-12 rounded-[2rem] shadow-sm hover:shadow-xl hover:border-primary/30 transition-all duration-300 max-w-4xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-black text-foreground mb-6 tracking-tight">{t('whoAreWe')}</h2>
          <p className="text-muted-foreground leading-relaxed text-lg font-medium">
            {t('whoAreWeDesc')}
          </p>
        </section>

        {/* OFFICIAL LINKS */}
        <section>
          <h2 className="text-3xl font-bold text-foreground mb-8 text-center">{t('links')}</h2>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { id: 'ucn', url: 'https://www.ucn.cl', icon: Building2, color: 'text-blue-500', bg: 'bg-blue-500/10' },
              { id: 'fcm', url: 'https://www.ucn.cl/universidad/facultades-escuelas-y-departamentos/facultad-de-ciencias-del-mar/', icon: Waves, color: 'text-teal-500', bg: 'bg-teal-500/10' },
              { id: 'campus', url: 'https://campusvirtual.ucn.cl', icon: Laptop, color: 'text-amber-500', bg: 'bg-amber-500/10' }
            ].map((link, idx) => {
              const Icon = link.icon;
              return (
                <a key={idx} href={link.url} target="_blank" rel="noopener noreferrer" className="group flex flex-col items-center justify-center p-8 bg-card border border-border rounded-[2rem] shadow-sm hover:shadow-xl hover:-translate-y-1 hover:border-primary/30 transition-all duration-300">
                  <div className={`w-16 h-16 rounded-[1rem] mb-5 flex items-center justify-center transition-transform duration-300 ${link.bg} ${link.color} group-hover:scale-110`}>
                    <Icon className="w-8 h-8" />
                  </div>
                  <span className="font-bold text-foreground text-xl mb-2 text-center transition-colors">{t(`linksCards.${link.id}.title`)}</span>
                  <div className="flex items-center text-sm font-medium text-foreground/50 group-hover:text-primary transition-colors">
                    <span>{t(`linksCards.${link.id}.desc`)}</span>
                    <ExternalLink className="w-4 h-4 ml-1 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
                  </div>
                </a>
              );
            })}
          </div>
        </section>

        {/* CAREERS */}
        <section className="pb-12">
          <h2 className="text-3xl font-bold text-foreground mb-8 text-center">{t('careers')}</h2>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { id: 'biologia', url: 'https://www.ucn.cl/universidad/facultades-escuelas-y-departamentos/facultad-de-ciencias-del-mar/departamento-de-biologia-marina/' },
              { id: 'acuicultura', url: 'https://www.ucn.cl/universidad/facultades-escuelas-y-departamentos/facultad-de-ciencias-del-mar/departamento-de-acuicultura/' },
              { id: 'prevencion', url: 'https://www.ucn.cl/universidad/facultades-escuelas-y-departamentos/facultad-de-ciencias-del-mar/escuela-de-prevencion-de-riesgo-y-medio-ambiente/' }
            ].map((career, idx) => (
              <a key={idx} href={career.url} target="_blank" rel="noopener noreferrer" className="flex flex-col p-8 bg-card border border-border rounded-[2rem] shadow-sm hover:shadow-xl hover:border-primary/40 hover:-translate-y-1 transition-all duration-300 group h-full focus-visible:ring-2 focus-visible:outline-none focus:ring-primary">
                <div className="bg-primary/10 text-primary p-4 rounded-xl mb-6 self-start transform group-hover:-rotate-6 transition-transform">
                  <BookOpen className="w-8 h-8" />
                </div>
                <div className="flex-grow flex flex-col justify-between">
                  <h3 className="font-bold text-xl text-foreground leading-tight group-hover:text-primary transition-colors mb-6">
                    {t(`careersCards.${career.id}.title`)}
                  </h3>
                  <div className="flex justify-between items-center text-sm font-bold text-primary opacity-80 group-hover:opacity-100 transition-opacity">
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
