import { useTranslations } from 'next-intl';
import { Link } from "@/i18n/routing";

export default function Footer() {
  const t = useTranslations('Footer');

  return (
    <footer className="overflow-hidden border-t border-border bg-muted px-6 py-12 text-foreground">
      <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        
        <div className="flex flex-col space-y-4">
          <span className="text-2xl font-bold tracking-tight text-foreground">MARSYS</span>
          <p className="mt-2 text-sm text-muted-foreground">
            {t('description')}
          </p>
        </div>

        <div className="flex flex-col space-y-4">
          <h3 className="text-lg font-semibold text-foreground">{t('platform')}</h3>
          <Link href="/login" className="text-sm text-muted-foreground transition-colors hover:text-primary">{t('login')}</Link>
          <Link href="/about" className="text-sm text-muted-foreground transition-colors hover:text-primary">{t('about')}</Link>
          <Link href="/fcm" className="text-sm text-muted-foreground transition-colors hover:text-primary">{t('fcm')}</Link>
        </div>

        <div className="flex flex-col space-y-4">
          <h3 className="text-lg font-semibold text-foreground">{t('university')}</h3>
          <a href="https://www.ucn.cl/" target="_blank" rel="noreferrer" className="text-sm text-muted-foreground transition-colors hover:text-primary">UCN</a>
          <a href="https://www.ucn.cl/universidad/facultades-escuelas-y-departamentos/facultad-de-ciencias-del-mar/" target="_blank" rel="noreferrer" className="text-sm text-muted-foreground transition-colors hover:text-primary">{t('faculty')}</a>
        </div>

        <div className="flex flex-col space-y-4">
          <h3 className="text-lg font-semibold text-foreground">{t('developers')}</h3>
          <div className="flex flex-col space-y-3">
            <a href="https://github.com/Marton1123" target="_blank" rel="noreferrer" className="flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-primary">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4"><path d="m7 11 2-2-2-2"></path><path d="M11 13h4"></path><rect width="18" height="18" x="3" y="3" rx="2" ry="2"></rect></svg>
              Martín Castillo
            </a>
            <a href="https://github.com/DiegoContreras-dev" target="_blank" rel="noreferrer" className="flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-primary">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4"><path d="m7 11 2-2-2-2"></path><path d="M11 13h4"></path><rect width="18" height="18" x="3" y="3" rx="2" ry="2"></rect></svg>
              Diego Contreras
            </a>
            <a href="https://github.com/Charmandiox9" target="_blank" rel="noreferrer" className="flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-primary">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4"><path d="m7 11 2-2-2-2"></path><path d="M11 13h4"></path><rect width="18" height="18" x="3" y="3" rx="2" ry="2"></rect></svg>
              Daniel Durán
            </a>
          </div>
        </div>
      </div>
      
      <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 border-t border-border pt-6 md:flex-row">
        <p className="text-center text-xs text-muted-foreground md:text-left">
          {t('rights', { year: new Date().getFullYear() })}
        </p>
        <Link href="/privacy" className="text-xs text-muted-foreground transition-colors hover:text-primary">
          {t('privacy')}
        </Link>
      </div>
    </footer>
  );
}
