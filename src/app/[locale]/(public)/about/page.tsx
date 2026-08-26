import { useTranslations } from 'next-intl';
import { History, Zap, Users } from 'lucide-react';
import Image from 'next/image';

export default function AboutPage() {
  const t = useTranslations('About');

  return (
    <div className="min-h-screen flex flex-col bg-background overflow-x-hidden selection:bg-primary/20">
      
      {/* HERO SECTION */}
      <section className="bg-muted relative py-20 px-6 overflow-hidden">
        <div className="absolute top-0 inset-x-0 h-full bg-gradient-to-b from-primary/5 to-transparent pointer-events-none"></div>
        <div className="max-w-[1400px] mx-auto text-center relative z-10 flex flex-col items-center">
          <div className="mb-6 flex items-center justify-center gap-2">
            <span className="text-xs font-bold uppercase tracking-widest text-primary bg-primary/10 px-4 py-1.5 rounded-full border border-primary/20 shadow-sm">
              Acerca de la plataforma
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
        
        {/* WHAT IS MARSYS */}
        <section className="text-center max-w-3xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-black text-foreground mb-6 tracking-tight">{t('whatIs')}</h2>
          <p className="text-muted-foreground leading-relaxed text-lg font-medium">
            {t('whatIsDesc')}
          </p>
        </section>

        {/* PROPOSAL */}
        <section>
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-foreground">{t('proposal')}</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { id: 'transparency', icon: History, color: 'text-blue-500', bg: 'bg-blue-500/10' },
              { id: 'efficiency', icon: Zap, color: 'text-amber-500', bg: 'bg-amber-500/10' },
              { id: 'collaboration', icon: Users, color: 'text-teal-500', bg: 'bg-teal-500/10' }
            ].map((card, idx) => {
              const Icon = card.icon;
              return (
                <div key={idx} className="bg-card border border-border p-8 rounded-3xl text-center hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-default group">
                  <div className={`w-16 h-16 ${card.bg} ${card.color} rounded-2xl flex items-center justify-center mx-auto mb-6 transform group-hover:scale-110 transition-transform`}>
                    <Icon className="w-8 h-8" />
                  </div>
                  <h3 className="text-xl font-bold text-foreground mb-3">{t(`proposalCards.${card.id}.title`)}</h3>
                  <p className="text-foreground/60 text-sm leading-relaxed font-medium">
                    {t(`proposalCards.${card.id}.desc`)}
                  </p>
                </div>
              );
            })}
          </div>
        </section>

        {/* TECHNOLOGY */}
        <section className="pt-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-foreground">{t('tech')}</h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-6">
            {[
              { name: 'Next.js', desc: 'React Framework', url: 'https://nextjs.org', iconUrl: 'https://cdn.simpleicons.org/nextdotjs/000000', invertDark: true },
              { name: 'NestJS', desc: 'Node Framework', url: 'https://nestjs.com', iconUrl: 'https://cdn.simpleicons.org/nestjs/E0234E' },
              { name: 'PostgreSQL', desc: 'Database', url: 'https://postgresql.org', iconUrl: 'https://cdn.simpleicons.org/postgresql/4169E1' },
              { name: 'Prisma', desc: 'ORM', url: 'https://prisma.io', iconUrl: 'https://cdn.simpleicons.org/prisma/000000', invertDark: true },
              { name: 'Google OAuth', desc: 'Authentication', url: 'https://oauth.net', iconUrl: 'https://cdn.simpleicons.org/google/000000', invertDark: true }
            ].map((tech, idx) => (
              <a key={idx} href={tech.url} target="_blank" rel="noopener noreferrer" className="border border-border p-6 rounded-3xl flex flex-col items-center justify-center text-center bg-muted hover:bg-card hover:shadow-lg hover:-translate-y-1 transition-all duration-300 group">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={tech.iconUrl} alt={`Logo de ${tech.name}`} className={`w-12 h-12 mb-4 opacity-80 group-hover:opacity-100 transition-opacity ${tech.invertDark ? 'dark:invert' : ''}`} />
                <span className="font-bold text-foreground text-sm mb-1 group-hover:text-primary transition-colors">{tech.name}</span>
                <span className="text-[11px] font-semibold text-foreground/50 uppercase tracking-wider">{tech.desc}</span>
              </a>
            ))}
          </div>
        </section>

        {/* DEVELOPERS */}
        <section className="pt-8 pb-12">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-foreground">{t('devs')}</h2>
          </div>
          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {[
              {
                name: 'Martín Castillo',
                role: 'Ingeniería en Tecnologías de Información',
                minor: 'Minor: Seguridad Digital',
                github: 'https://github.com/Marton1123',
                linkedin: 'https://www.linkedin.com/in/martin-castillo-t'
              },
              {
                name: 'Daniel Durán',
                role: 'Ingeniería en Tecnologías de Información',
                minor: 'Minor: Arquitectura de Software',
                github: 'https://github.com/Charmandiox9',
                linkedin: 'https://www.linkedin.com/in/daniel-durán-garcía/'
              }
            ].map((dev, idx) => (
              <div key={idx} className="p-8 bg-card border border-border rounded-[2rem] shadow-sm flex flex-col justify-between hover:shadow-xl hover:border-primary/30 transition-all duration-300 group relative overflow-hidden">
                <div className="absolute top-0 inset-x-0 h-24 bg-muted rounded-t-[2rem]"></div>
                
                <div className="flex flex-col items-center mb-6 relative z-10 pt-4">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={`${dev.github}.png`} alt={`Avatar de ${dev.name}`} className="w-28 h-28 rounded-full border-4 border-background shadow-md mb-5 object-cover group-hover:scale-105 transition-transform" />
                  <h3 className="font-black text-2xl text-foreground text-center mb-1">{dev.name}</h3>
                  <p className="text-sm font-semibold text-foreground/60 text-center">{dev.role}</p>
                  <span className="text-xs font-bold uppercase tracking-wider text-primary bg-primary/10 px-3 py-1 rounded-full mt-4 text-center">{dev.minor}</span>
                </div>
                
                <div className="mt-4 pt-6 border-t border-foreground/5 flex items-center justify-center gap-4">
                  <a href={dev.github} target="_blank" rel="noopener noreferrer" className="flex-1 flex items-center justify-center gap-2 py-3 bg-muted hover:bg-foreground/10 rounded-xl text-foreground/80 hover:text-foreground transition-colors text-sm font-bold">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4"><path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4"></path><path d="M9 18c-4.51 2-5-2-7-2"></path></svg>
                    <span>GitHub</span>
                  </a>
                  <a href={dev.linkedin} target="_blank" rel="noopener noreferrer" className="flex-1 flex items-center justify-center gap-2 py-3 bg-primary/10 hover:bg-primary/20 rounded-xl text-primary transition-colors text-sm font-bold">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"></path><rect width="4" height="12" x="2" y="9"></rect><circle cx="4" cy="4" r="2"></circle></svg>
                    <span>LinkedIn</span>
                  </a>
                </div>
              </div>
            ))}
          </div>
        </section>

      </main>
    </div>
  );
}
