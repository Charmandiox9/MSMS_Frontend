import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/routing';
import { FlaskConical, CarFront, TrendingUp, Users, ArrowRight } from 'lucide-react';

export default function LandingPage() {
  const t = useTranslations('Landing');

  return (
    <div className="min-h-screen flex flex-col bg-background relative selection:bg-primary/20">
      
      {/* Subtle Background Glows */}
      <div className="absolute top-0 inset-x-0 h-screen overflow-hidden pointer-events-none z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] rounded-full bg-primary/5 blur-[100px]"></div>
        <div className="absolute top-[20%] right-[-10%] w-[600px] h-[600px] rounded-full bg-secondary/5 blur-[120px]"></div>
      </div>

      <main className="flex-grow z-10 pb-20">
        
        {/* HERO SECTION */}
        <section className="pt-20 pb-24 md:pt-32 md:pb-32 flex flex-col justify-center min-h-[85vh]">
          <div className="max-w-[1400px] mx-auto px-4 sm:px-6 w-full grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            
            <div className="lg:col-span-7 text-center lg:text-left flex flex-col items-center lg:items-start">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 mb-8 text-xs font-semibold tracking-wider text-foreground/80 bg-foreground/5 rounded-full border border-foreground/10">
                <span className="w-1.5 h-1.5 rounded-full bg-primary"></span>
                {t('badge')}
              </div>
              
              <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight mb-6 text-foreground leading-[1.15]">
                <span className="block">{t('title_part1')}</span>
                <span className="block text-primary">{t('title_part2')}</span>
              </h1>
              
              <p className="text-lg md:text-xl text-foreground/70 mb-10 max-w-2xl leading-relaxed">
                {t('description')}
              </p>
              
              <div className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto">
                <Link 
                  href="/login"
                  className="w-full sm:w-auto px-8 py-3.5 text-sm font-bold text-primary-foreground bg-primary hover:bg-primary/90 border-2 border-transparent rounded-[1.25rem] shadow-sm transition-all text-center"
                >
                  {t('login')}
                </Link>
                <Link 
                  href="/fcm"
                  className="w-full sm:w-auto px-8 py-3.5 text-sm font-bold text-foreground bg-transparent border-2 border-foreground/20 rounded-[1.25rem] hover:bg-foreground/5 transition-all text-center flex items-center justify-center gap-2"
                >
                  Conocer la Facultad
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>

            {/* Clean UI Mockup */}
            <div className="lg:col-span-5 hidden lg:flex justify-center items-center w-full h-[400px] relative">
               <div className="relative w-full max-w-md aspect-square bg-foreground/5 rounded-[2rem] border border-foreground/10 p-6 flex flex-col gap-4 shadow-sm">
                  <div className="w-full h-12 bg-background rounded-xl border border-foreground/10 flex items-center px-4 justify-between">
                     <div className="w-1/3 h-3 bg-foreground/10 rounded-full"></div>
                     <div className="w-8 h-8 rounded-full bg-primary/20"></div>
                  </div>
                  <div className="flex gap-4 h-full">
                     <div className="flex-1 bg-background rounded-xl border border-foreground/10 p-4 flex flex-col gap-3">
                        <div className="w-1/2 h-3 bg-foreground/10 rounded-full mb-2"></div>
                        <div className="w-full h-16 bg-primary/10 rounded-lg"></div>
                        <div className="w-full h-16 bg-secondary/10 rounded-lg"></div>
                     </div>
                     <div className="w-1/3 flex flex-col gap-4">
                        <div className="flex-1 bg-background rounded-xl border border-foreground/10 flex items-center justify-center">
                           <div className="w-12 h-12 rounded-full border-4 border-foreground/5 border-t-primary rounded-full"></div>
                        </div>
                        <div className="flex-1 bg-background rounded-xl border border-foreground/10 p-3 flex flex-col justify-center gap-2">
                           <div className="w-full h-2 bg-foreground/10 rounded-full"></div>
                           <div className="w-2/3 h-2 bg-foreground/10 rounded-full"></div>
                        </div>
                     </div>
                  </div>
               </div>
            </div>
          </div>
        </section>

        {/* KPIs SECTION */}
        <section className="px-4 sm:px-6 mb-20 md:mb-28">
          <div className="max-w-[1400px] mx-auto border-t border-foreground/10 pt-12">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
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
            </div>
          </div>
        </section>

        {/* FEATURES SECTION */}
        <section className="py-20 md:py-28 px-4 sm:px-6 bg-foreground/[0.03] border-y border-foreground/5">
          <div className="max-w-[1400px] mx-auto">
            <div className="text-center mb-16 md:mb-20">
              <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">{t('features.title')}</h2>
              <p className="text-foreground/70 max-w-2xl mx-auto text-base md:text-lg">{t('features.subtitle')}</p>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8 max-w-[1300px] mx-auto">
              {[
                { title: t('features.lab.title'), desc: t('features.lab.desc'), icon: FlaskConical },
                { title: t('features.vehicles.title'), desc: t('features.vehicles.desc'), icon: CarFront },
                { title: t('features.tracking.title'), desc: t('features.tracking.desc'), icon: TrendingUp },
                { title: t('features.roles.title'), desc: t('features.roles.desc'), icon: Users }
              ].map((feature, i) => {
                const Icon = feature.icon;
                return (
                  <div key={i} className="bg-background p-8 rounded-[1.5rem] shadow-sm border border-foreground/10 hover:shadow-md transition-shadow cursor-default flex flex-col group">
                    <div className="w-14 h-14 bg-primary/10 text-primary rounded-[1rem] flex items-center justify-center mb-6 group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                      <Icon className="w-7 h-7" />
                    </div>
                    <h3 className="text-xl font-bold text-foreground mb-3">{feature.title}</h3>
                    <p className="text-foreground/70 text-sm leading-relaxed">{feature.desc}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* RECENT PROJECTS SECTION */}
        <section className="py-20 md:py-28">
          <div className="max-w-[1400px] mx-auto px-4 sm:px-6 mb-12">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
              <div>
                <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-3">{t('recent.title')}</h2>
                <p className="text-foreground/70 text-base md:text-lg">{t('recent.subtitle')}</p>
              </div>
              <Link href="/fcm" className="text-sm font-semibold text-primary hover:text-primary/80 flex items-center gap-2 group bg-primary/5 px-5 py-2.5 rounded-full transition-colors">
                {t('recent.viewAll')}
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
          </div>

          <div className="w-full">
            <div className="flex overflow-x-auto gap-6 pb-12 snap-x snap-mandatory [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] px-4 sm:px-6 xl:px-[calc((100vw-1400px)/2)]">
              {[1, 2, 3, 4, 5].map((item) => (
                <div key={item} className="min-w-[280px] md:min-w-[320px] shrink-0 snap-center md:snap-start group rounded-2xl overflow-hidden border border-foreground/10 bg-background shadow-sm hover:shadow-md transition-shadow cursor-pointer flex flex-col">
                  {/* Image Area */}
                  <div className="h-40 bg-foreground/5 relative overflow-hidden flex items-center justify-center border-b border-foreground/10">
                    <svg className="w-10 h-10 text-foreground/20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <rect width="18" height="18" x="3" y="3" rx="2" ry="2"></rect>
                      <circle cx="9" cy="9" r="2"></circle>
                      <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"></path>
                    </svg>
                    <div className="absolute top-3 right-3 z-10">
                      <span className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider bg-background text-foreground border border-foreground/10 rounded-full shadow-sm">
                        {item % 2 !== 0 ? 'A+S' : 'Investigación'}
                      </span>
                    </div>
                  </div>
                  
                  {/* Content Area */}
                  <div className="p-5 flex flex-col flex-grow">
                    <h3 className="font-bold text-lg mb-2 text-foreground group-hover:text-primary transition-colors line-clamp-2">
                      {item === 1 ? 'Manejo Sustentable de Algas' : 
                       item === 2 ? 'Impacto del Cambio Climático en Arrecifes' : 
                       item === 3 ? 'Tecnologías de Acuicultura Offshore' :
                       item === 4 ? 'Biotecnología Marina Aplicada' :
                       'Conservación de Ecosistemas'}
                    </h3>
                    <p className="text-sm text-foreground/60 line-clamp-2 mb-5">
                      Estudio enfocado en el desarrollo de nuevas metodologías para mejorar el ecosistema marino de la región de Coquimbo. Analizamos las variables climáticas a lo largo de un período extenso.
                    </p>
                    
                    <div className="mt-auto flex items-center justify-between pt-4 border-t border-foreground/5">
                      <div className="flex items-center gap-3">
                        <div className="w-7 h-7 rounded-full bg-foreground/10 flex items-center justify-center text-[10px] font-bold text-foreground">
                          {item % 2 !== 0 ? 'DR' : 'MC'}
                        </div>
                        <div className="flex flex-col">
                          <span className="text-xs font-bold text-foreground">
                            {item % 2 !== 0 ? 'Dr. Roberto Pérez' : 'MSc. Laura Campos'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

      </main>
    </div>
  );
}
