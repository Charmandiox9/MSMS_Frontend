"use client";

import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/routing';
import { ArrowLeft, Home } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function NotFoundPage() {
  const t = useTranslations('NotFound');
  const router = useRouter();

  const handleBack = () => {
    if (window.history.length > 2) {
      router.back();
    } else {
      router.push('/');
    }
  };

  return (
    <div className="flex-grow w-full flex flex-col items-center justify-center bg-slate-50 dark:bg-[#020b18] min-h-[calc(100vh-73px)] relative overflow-hidden transition-colors duration-500 selection:bg-ocean-cyan/30">
      
      <style>{`
        @keyframes sway {
          0%, 100% { transform: translateX(0) scale(1) rotate(-1deg); }
          50% { transform: translateX(-2%) scale(1.02) rotate(1deg); }
        }
        @keyframes sway-alt {
          0%, 100% { transform: translateX(0) scale(1.02) rotate(1deg); }
          50% { transform: translateX(2%) scale(1) rotate(-1deg); }
        }
        .wave-bottom-1 { animation: sway 25s ease-in-out infinite; transform-origin: bottom center; }
        .wave-bottom-2 { animation: sway-alt 30s ease-in-out infinite; transform-origin: bottom center; }
      `}</style>

      {/* Background Orbs/Waves */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none flex justify-center items-center">
        <div className="absolute w-[80vw] h-[80vw] max-w-[800px] max-h-[800px] bg-cyan-300/20 dark:bg-cyan-900/10 rounded-full blur-[100px] md:blur-[150px] animate-[pulse_15s_ease-in-out_infinite]"></div>
        <div className="absolute w-[60vw] h-[60vw] max-w-[600px] max-h-[600px] bg-blue-400/20 dark:bg-blue-900/10 rounded-full blur-[80px] md:blur-[120px] animate-[pulse_10s_ease-in-out_infinite_reverse] translate-y-20"></div>
      </div>

      {/* Oceanic Waves at the bottom */}
      <div className="absolute bottom-0 left-0 right-0 h-[40vh] md:h-[50vh] pointer-events-none overflow-hidden opacity-80 dark:opacity-40 mix-blend-multiply dark:mix-blend-color-dodge z-0 transition-opacity duration-500">
        <svg className="absolute w-[200%] h-[150%] bottom-[-20%] left-[-50%] wave-bottom-1" viewBox="0 0 800 800" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none">
          <path d="M0 400C100 300 200 500 400 400C600 300 700 500 800 400L800 800L0 800Z" fill="#0ea5e9" opacity="0.3" />
        </svg>
        <svg className="absolute w-[200%] h-[150%] bottom-[-20%] left-[-50%] wave-bottom-2" viewBox="0 0 800 800" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none">
          <path d="M0 500C200 400 300 600 500 500C700 400 800 600 800 500L800 800L0 800Z" fill="#0369a1" opacity="0.4" />
        </svg>
      </div>

      <div className="relative z-10 flex flex-col items-center text-center max-w-3xl px-6 w-full">
        
        {/* Massive 404 Text */}
        <h1 className="text-[12rem] md:text-[18rem] font-black text-transparent bg-clip-text bg-gradient-to-b from-slate-200 to-slate-50 dark:from-white/10 dark:to-transparent tracking-tighter leading-none mb-0 select-none animate-in slide-in-from-bottom-10 duration-1000 fade-in drop-shadow-sm dark:drop-shadow-none relative z-0">
          404
        </h1>
        
        {/* Content Floating over the 404 */}
        <div className="flex flex-col items-center -mt-16 md:-mt-32 animate-in slide-in-from-bottom-10 duration-1000 fade-in delay-200 fill-mode-both relative z-10">
          <h2 className="text-3xl md:text-5xl font-black text-slate-900 dark:text-white mb-6 tracking-tight drop-shadow-sm">
            {t('subtitle')}
          </h2>
          
          <p className="text-lg md:text-xl font-medium text-slate-600 dark:text-white/70 mb-10 max-w-lg mx-auto leading-relaxed">
            {t('description')}
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 w-full sm:w-auto">
            {/* Go Back Button */}
            <button 
              onClick={handleBack}
              className="inline-flex items-center justify-center gap-2 w-full sm:w-auto bg-white/60 dark:bg-white/5 backdrop-blur-md border border-slate-200 dark:border-white/10 text-slate-700 dark:text-white/90 font-bold py-4 px-8 rounded-full shadow-sm hover:bg-white dark:hover:bg-white/10 transition-all hover:scale-105 active:scale-95 group/btn"
            >
              <ArrowLeft className="w-5 h-5 group-hover/btn:-translate-x-1 transition-transform" />
              <span>{t('goBack')}</span>
            </button>

            {/* Go Home Button */}
            <Link href="/" className="inline-flex items-center justify-center gap-2 w-full sm:w-auto bg-slate-900 dark:bg-white border border-slate-800 dark:border-white/10 text-white dark:text-slate-900 font-bold py-4 px-8 rounded-full shadow-[0_8px_30px_rgba(0,0,0,0.06)] dark:shadow-[0_0_20px_rgba(255,255,255,0.1)] hover:border-ocean-cyan/50 dark:hover:border-cyan-500/50 transition-all hover:scale-105 active:scale-95 group/btn overflow-hidden relative">
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-slate-700 dark:via-white/5 to-transparent -translate-x-[100%] group-hover/btn:translate-x-[100%] transition-transform duration-1000"></div>
              <Home className="w-5 h-5 group-hover/btn:-translate-y-0.5 transition-transform relative z-10 text-white/70 dark:text-slate-900/70 group-hover/btn:text-white dark:group-hover/btn:text-slate-900" />
              <span className="relative z-10">{t('back')}</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
