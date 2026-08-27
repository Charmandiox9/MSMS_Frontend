"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";

export default function CookieConsent() {
  const t = useTranslations("Privacy");
  const [showBanner, setShowBanner] = useState(false);
  const [showModal, setShowModal] = useState(false);

  const [preferences, setPreferences] = useState({
    necessary: true,
    analytics: false,
    marketing: false,
  });

  useEffect(() => {
    // Verificar si el usuario ya configuró las cookies
    const saved = localStorage.getItem("marsys_cookie_consent");
    if (!saved) {
      setShowBanner(true);
    } else {
      try {
        const parsed = JSON.parse(saved);
        setPreferences(parsed);
      } catch (e) {
        // En caso de que haya una cookie antigua sin formato JSON
        setShowBanner(true);
      }
    }
  }, []);

  const saveConsent = (prefs: typeof preferences) => {
    localStorage.setItem("marsys_cookie_consent", JSON.stringify(prefs));
    setPreferences(prefs);
    setShowBanner(false);
    setShowModal(false);
  };

  const acceptAll = () => saveConsent({ necessary: true, analytics: true, marketing: true });
  const rejectAll = () => saveConsent({ necessary: true, analytics: false, marketing: false });
  const savePreferences = () => saveConsent(preferences);

  if (!showBanner && !showModal) return null;

  return (
    <>
      {/* BANNER PRINCIPAL */}
      {showBanner && (
        <div className="fixed bottom-0 left-0 right-0 p-4 md:p-6 bg-ucn-navy border-t border-white/10 text-white z-[9998] shadow-2xl flex flex-col xl:flex-row items-center justify-between gap-4 animate-in slide-in-from-bottom-10 duration-500">
          <div className="text-sm text-center xl:text-left text-white/90 max-w-4xl">
            <p>
              {t('cookie_message')}{" "}
              <Link href="/privacy" className="underline text-ocean-cyan hover:text-ocean-cyan/80 font-bold transition-colors">
                {t('privacy_policy')}
              </Link>.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 w-full xl:w-auto">
            <button 
              onClick={() => setShowModal(true)} 
              className="px-4 py-2 bg-transparent border border-white/20 text-white text-sm font-bold rounded-lg hover:bg-white/10 transition-colors whitespace-nowrap"
            >
              {t('manage')}
            </button>
            <button 
              onClick={rejectAll} 
              className="px-4 py-2 bg-transparent border border-white/20 text-white text-sm font-bold rounded-lg hover:bg-white/10 transition-colors whitespace-nowrap"
            >
              {t('reject_all')}
            </button>
            <button 
              onClick={acceptAll} 
              className="px-6 py-2 bg-ocean-cyan text-white text-sm font-bold rounded-lg hover:bg-ocean-cyan/90 transition-colors whitespace-nowrap shadow-md"
            >
              {t('accept_all')}
            </button>
          </div>
        </div>
      )}

      {/* MODAL DE PREFERENCIAS (Ley N° 21.719) */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9999] flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-ucn-navy border border-white/10 rounded-2xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl flex flex-col gap-6 max-h-[90vh] overflow-y-auto">
            <div>
              <h2 className="text-2xl font-bold text-white mb-2">{t('preferences_title')}</h2>
              <p className="text-sm text-white/70">{t('preferences_desc')}</p>
            </div>

            <div className="flex flex-col gap-4">
              {/* Estrictamente Necesarias */}
              <div className="flex gap-4 items-start p-4 bg-white/5 rounded-xl border border-white/10">
                <div className="flex-1">
                  <h3 className="text-white font-bold mb-1">{t('necessary_title')}</h3>
                  <p className="text-sm text-white/60">{t('necessary_desc')}</p>
                </div>
                <label className="relative inline-flex items-center opacity-50 cursor-not-allowed">
                  <input type="checkbox" className="sr-only peer" checked disabled />
                  <div className="w-11 h-6 bg-ocean-cyan rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all"></div>
                </label>
              </div>

              {/* Analíticas */}
              <div className="flex gap-4 items-start p-4 bg-white/5 rounded-xl border border-white/10">
                <div className="flex-1">
                  <h3 className="text-white font-bold mb-1">{t('analytics_title')}</h3>
                  <p className="text-sm text-white/60">{t('analytics_desc')}</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input 
                    type="checkbox" 
                    className="sr-only peer"
                    checked={preferences.analytics}
                    onChange={(e) => setPreferences({...preferences, analytics: e.target.checked})}
                  />
                  <div className="w-11 h-6 bg-white/20 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-ocean-cyan"></div>
                </label>
              </div>

              {/* Marketing */}
              <div className="flex gap-4 items-start p-4 bg-white/5 rounded-xl border border-white/10">
                <div className="flex-1">
                  <h3 className="text-white font-bold mb-1">{t('marketing_title')}</h3>
                  <p className="text-sm text-white/60">{t('marketing_desc')}</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input 
                    type="checkbox" 
                    className="sr-only peer"
                    checked={preferences.marketing}
                    onChange={(e) => setPreferences({...preferences, marketing: e.target.checked})}
                  />
                  <div className="w-11 h-6 bg-white/20 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-ocean-cyan"></div>
                </label>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row justify-end gap-3 mt-4 pt-6 border-t border-white/10">
              <button 
                onClick={() => setShowModal(false)} 
                className="px-6 py-2 bg-transparent text-white/70 text-sm font-bold rounded-lg hover:text-white transition-colors"
              >
                Volver
              </button>
              <button 
                onClick={rejectAll} 
                className="px-6 py-2 bg-transparent border border-white/20 text-white text-sm font-bold rounded-lg hover:bg-white/10 transition-colors"
              >
                {t('reject_all')}
              </button>
              <button 
                onClick={savePreferences} 
                className="px-6 py-2 bg-ocean-cyan text-white text-sm font-bold rounded-lg hover:bg-ocean-cyan/90 transition-colors shadow-md"
              >
                {t('save_preferences')}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
