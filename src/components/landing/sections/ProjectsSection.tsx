import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/routing';
import { ArrowRight } from "lucide-react";

export default function ProjectsSection() {
  const t = useTranslations('Landing');

  return (
    <section className="py-20 md:py-28">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 mb-12">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-3">{t('recent.title')}</h2>
            <p className="text-muted-foreground text-base md:text-lg">{t('recent.subtitle')}</p>
          </div>
          <Link href="/fcm" aria-label={t('recent.viewAll')} className="text-sm font-semibold text-primary hover:text-primary/80 flex items-center gap-2 group bg-primary/5 px-5 py-2.5 rounded-full transition-colors">
            {t('recent.viewAll')}
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" aria-hidden="true" />
          </Link>
        </div>
      </div>

      <div className="w-full">
        <div className="flex overflow-x-auto gap-6 pb-12 snap-x snap-mandatory [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] px-4 sm:px-6 xl:px-[calc((100vw-1400px)/2)]">
          {[1, 2, 3, 4, 5].map((item) => (
            <div key={item} className="min-w-[240px] md:min-w-[260px] w-[240px] md:w-[260px] shrink-0 snap-center md:snap-start group rounded-2xl overflow-hidden border border-border bg-background shadow-sm hover:shadow-md transition-shadow cursor-pointer flex flex-col">
              {/* Image Area */}
              <div className="h-36 relative overflow-hidden border-b border-border">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img 
                  src={`https://images.unsplash.com/photo-1583212292454-1fe6229603b7?q=80&w=400&auto=format&fit=crop&sig=${item}`} 
                  alt={`${t('recent.title')} ${item}`} 
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute top-3 right-3 z-10">
                  <span className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider bg-background text-foreground border border-border rounded-full shadow-sm">
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
  );
}
