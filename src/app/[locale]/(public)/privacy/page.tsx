import { useTranslations } from "next-intl";

export default function PrivacyPage() {
  const t = useTranslations("PrivacyPolicy");

  return (
    <main className="min-h-screen py-32 px-6 max-w-4xl mx-auto">
      <h1 className="text-4xl font-black text-foreground mb-2 tracking-tight">
        {t('title')}
      </h1>
      <p className="text-sm text-muted-foreground mb-12">
        {t('last_updated')}
      </p>

      <div className="space-y-12">
        <section>
          <h2 className="text-2xl font-bold text-ocean-cyan mb-4">
            {t('intro_title')}
          </h2>
          <p className="text-foreground/80 leading-relaxed">
            {t('intro_text')}
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-ocean-cyan mb-4">
            {t('collection_title')}
          </h2>
          <p className="text-foreground/80 leading-relaxed">
            {t('collection_text')}
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-ocean-cyan mb-4">
            {t('use_title')}
          </h2>
          <p className="text-foreground/80 leading-relaxed">
            {t('use_text')}
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-ocean-cyan mb-4">
            {t('arco_title')}
          </h2>
          <p className="text-foreground/80 leading-relaxed">
            {t('arco_text')}
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-ocean-cyan mb-4">
            {t('cookies_title')}
          </h2>
          <p className="text-foreground/80 leading-relaxed">
            {t('cookies_text')}
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-ocean-cyan mb-4">
            {t('contact_title')}
          </h2>
          <p className="text-foreground/80 leading-relaxed">
            {t('contact_text')}
          </p>
        </section>
      </div>
    </main>
  );
}
