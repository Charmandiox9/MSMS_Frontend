import { useTranslations } from 'next-intl';
import { FlaskConical, CarFront, TrendingUp, Users } from 'lucide-react';

export default function FeaturesSection() {
  const t = useTranslations('Landing');

  return (
    <section className="py-20 md:py-28 px-4 sm:px-6 bg-muted/50 border-y border-border">
      <div className="max-w-[1400px] mx-auto">
        <div className="text-center mb-16 md:mb-20">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">{t('features.title')}</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto text-base md:text-lg">{t('features.subtitle')}</p>
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
              <div key={i} className="bg-background p-8 rounded-[1.5rem] shadow-sm border border-border hover:shadow-md transition-shadow cursor-default flex flex-col group">
                <div className="w-14 h-14 bg-primary/10 text-primary rounded-[1rem] flex items-center justify-center mb-6 group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                  <Icon className="w-7 h-7" />
                </div>
                <h3 className="text-xl font-bold text-foreground mb-3">{feature.title}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">{feature.desc}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
