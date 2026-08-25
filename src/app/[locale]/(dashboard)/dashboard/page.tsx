import { useTranslations } from 'next-intl';

export default function DashboardPage() {
  const t = useTranslations('Dashboard');

  return (
    <div className="min-h-[85vh] flex flex-col bg-background p-8 max-w-7xl mx-auto w-full">
      
      {/* Header del Dashboard */}
      <div className="mb-8 border-b border-foreground/10 pb-6">
        <h1 className="text-3xl font-black text-foreground mb-2">
          {t('title')}
        </h1>
        <p className="text-foreground/60 font-medium">
          {t('subtitle')}
        </p>
      </div>

      {/* Contenido Principal */}
      <div className="grid md:grid-cols-3 gap-6">
        
        {/* Tarjeta de Bienvenida */}
        <div className="col-span-1 md:col-span-2 bg-foreground/5 border border-foreground/10 rounded-2xl p-8 flex items-center justify-center min-h-[300px]">
          <div className="text-center">
            <h2 className="text-xl font-bold text-foreground mb-2">{t('welcome')}</h2>
            <p className="text-foreground/60">{t('welcomeDesc')}</p>
          </div>
        </div>

        {/* Panel lateral rápido */}
        <div className="bg-background border border-foreground/10 shadow-sm rounded-2xl p-6 flex flex-col gap-4">
          <h3 className="font-bold text-foreground text-lg mb-2">{t('quickActions')}</h3>
          
          <button className="w-full py-3 bg-primary/10 hover:bg-primary/20 text-primary rounded-xl font-semibold transition-colors">
            {t('action1')}
          </button>
          <button className="w-full py-3 bg-foreground/5 hover:bg-foreground/10 text-foreground rounded-xl font-semibold transition-colors">
            {t('action2')}
          </button>
        </div>

      </div>
    </div>
  );
}
