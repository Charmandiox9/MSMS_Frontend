import { useTranslations } from 'next-intl';
import { Link } from "@/i18n/routing";

export default function Footer() {
  const t = useTranslations('Footer');

  return (
    <footer className="bg-ucn-navy text-white py-12 px-6 border-t border-ucn-navy overflow-hidden">
      <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        
        <div className="flex flex-col space-y-4">
          <span className="text-2xl font-black tracking-tight text-white">MARSYS</span>
          <p className="text-sm text-white/70 mt-2">
            {t('description')}
          </p>
        </div>

        <div className="flex flex-col space-y-4">
          <h3 className="font-semibold text-lg text-white">{t('platform')}</h3>
          <Link href="/login" className="text-sm text-white/70 hover:text-ocean-cyan transition-colors">{t('login')}</Link>
          <Link href="/about" className="text-sm text-white/70 hover:text-ocean-cyan transition-colors">{t('about')}</Link>
          <Link href="/fcm" className="text-sm text-white/70 hover:text-ocean-cyan transition-colors">{t('fcm')}</Link>
        </div>

        <div className="flex flex-col space-y-4">
          <h3 className="font-semibold text-lg text-white">{t('university')}</h3>
          <a href="https://www.ucn.cl/" target="_blank" rel="noreferrer" className="text-sm text-white/70 hover:text-ocean-cyan transition-colors">UCN</a>
          <a href="https://www.ucn.cl/universidad/facultades-escuelas-y-departamentos/facultad-de-ciencias-del-mar/" target="_blank" rel="noreferrer" className="text-sm text-white/70 hover:text-ocean-cyan transition-colors">{t('faculty')}</a>
        </div>

        <div className="flex flex-col space-y-4">
          <h3 className="font-semibold text-lg text-white">{t('developers')}</h3>
          <div className="flex flex-col space-y-3">
            <a href="https://github.com/Marton1123" target="_blank" rel="noreferrer" className="text-sm text-white/70 hover:text-ocean-cyan transition-colors flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4"><path d="m7 11 2-2-2-2"></path><path d="M11 13h4"></path><rect width="18" height="18" x="3" y="3" rx="2" ry="2"></rect></svg>
              Martín Castillo
            </a>
            <a href="https://github.com/DiegoContreras-dev" target="_blank" rel="noreferrer" className="text-sm text-white/70 hover:text-ocean-cyan transition-colors flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4"><path d="m7 11 2-2-2-2"></path><path d="M11 13h4"></path><rect width="18" height="18" x="3" y="3" rx="2" ry="2"></rect></svg>
              Diego Contreras
            </a>
            <a href="https://github.com/Charmandiox9" target="_blank" rel="noreferrer" className="text-sm text-white/70 hover:text-ocean-cyan transition-colors flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4"><path d="m7 11 2-2-2-2"></path><path d="M11 13h4"></path><rect width="18" height="18" x="3" y="3" rx="2" ry="2"></rect></svg>
              Daniel Durán
            </a>
          </div>
        </div>
      </div>
      
      <div className="max-w-7xl mx-auto border-t border-white/10 pt-6 flex flex-col md:flex-row justify-between items-center gap-4">
        <p className="text-center md:text-left text-xs text-white/50">
          {t('rights', { year: new Date().getFullYear() })}
        </p>
        <Link href="/privacy" className="text-xs text-white/50 hover:text-ocean-cyan transition-colors">
          {t('privacy')}
        </Link>
      </div>
    </footer>
  );
}
