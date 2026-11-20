import { useTranslations } from 'next-intl';
import { googleLoginUrl } from '@/lib/auth';
import { withBasePath } from '@/lib/base-path';
import LoginSquid from '@/components/auth/LoginSquid';
import LoginPreferences from '@/components/auth/LoginPreferences';

export default function LoginPage() {
  const t = useTranslations('Login');

  return (
    <div data-illustration-palette="login" className="login-visual relative isolate grid min-h-dvh w-full overflow-hidden bg-slate-50 selection:bg-ocean-cyan/30 transition-colors duration-500 dark:bg-[#020b18] lg:grid-cols-2">
      <LoginPreferences />
      <LoginSquid />
      <div className="hidden lg:flex relative flex-col p-12 overflow-visible bg-white dark:bg-[#010a14] transition-colors duration-500">
        <div className="absolute inset-0 z-0 bg-gradient-to-br from-blue-50 to-cyan-100 dark:from-[#000d1a] dark:to-[#002a4d] overflow-hidden transition-colors duration-500">
          <div className="absolute inset-0 flex items-center justify-center opacity-70 dark:opacity-50 mix-blend-multiply dark:mix-blend-color-dodge pointer-events-none transition-all duration-500">
            <svg className="absolute h-[160%] w-[160%]" viewBox="0 0 800 800" xmlns="http://www.w3.org/2000/svg">
              <path d="M0 400C100 300 200 500 400 400C600 300 700 500 800 400L800 800L0 800Z" fill="#0ea5e9" />
              <path d="M0 500C200 400 300 600 500 500C700 400 800 600 800 500L800 800L0 800Z" fill="#0369a1" opacity="0.4" />
            </svg>
            <svg className="absolute h-[160%] w-[160%]" viewBox="0 0 800 800" xmlns="http://www.w3.org/2000/svg">
              <path d="M0 450C150 350 250 550 450 450C650 350 750 550 800 450L800 800L0 800Z" fill="#0284c7" opacity="0.6" />
            </svg>
          </div>
        </div>
        <div className="absolute inset-0 z-0 bg-gradient-to-r from-white via-white/80 to-transparent dark:from-[#010a14] dark:via-[#010a14]/90 dark:to-transparent w-full pointer-events-none transition-colors duration-500"></div>
        <div className="absolute inset-0 z-0 bg-gradient-to-b from-transparent via-white/40 to-white/90 dark:from-transparent dark:via-[#010a14]/30 dark:to-[#010a14]/90 w-full pointer-events-none transition-colors duration-500"></div>
        <div className="pointer-events-none absolute inset-y-0 right-0 z-20 w-12 bg-gradient-to-r from-transparent to-slate-50/45 dark:to-[#020b18]/45"></div>
        <div className="relative z-10 flex-grow flex flex-col justify-start pt-[10vh] items-start w-full max-w-lg mx-auto pl-4 lg:pl-0">
          <h1 className="text-6xl lg:text-7xl font-black text-slate-900 dark:text-white mb-6 tracking-tighter leading-[1.05] drop-shadow-sm dark:drop-shadow-[0_4px_25px_rgba(0,0,0,1)] transition-colors duration-500">
            {t('welcomeTitle')} <br/>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-ocean-cyan to-blue-600 dark:from-cyan-300 dark:to-blue-500 drop-shadow-sm dark:drop-shadow-[0_0_15px_rgba(14,165,233,0.3)]">MARSYS</span>
          </h1>
          <p className="text-lg lg:text-xl text-slate-700 dark:text-white/90 font-medium leading-relaxed dark:drop-shadow-[0_2px_15px_rgba(0,0,0,1)] transition-colors duration-500">
            {t('welcomeDesc')}
          </p>
        </div>
      </div>

      <div className="relative z-[2] flex min-w-0 items-center justify-center bg-slate-50/30 px-4 pb-8 pt-24 transition-colors duration-300 dark:bg-[#020b18]/30 sm:px-6 sm:pb-12 lg:p-12 lg:bg-slate-50/25 dark:lg:bg-[#020b18]/25">
        <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
          <div className="absolute inset-0 bg-gradient-to-r from-slate-50/5 via-slate-50/15 to-slate-50/30 dark:from-[#020b18]/5 dark:via-[#020b18]/15 dark:to-[#020b18]/30"></div>
        </div>
        <div className="w-full max-w-[440px] relative z-10">
          <div className="group/card relative flex flex-col overflow-hidden rounded-[2rem] border border-slate-200/80 bg-white/95 p-6 shadow-[0_8px_40px_rgba(0,0,0,0.04)] transition-colors duration-200 hover:border-ocean-cyan/30 dark:border-white/10 dark:bg-[#0f172a]/90 dark:shadow-[0_20px_60px_rgba(0,0,0,0.4)] dark:hover:border-cyan-500/30 sm:p-10">
            <div className="flex items-center gap-3 mb-8 sm:gap-4 sm:mb-10">
              <div className="w-12 h-12 sm:w-16 sm:h-16 bg-white dark:bg-[#0f172a] text-ocean-cyan dark:text-cyan-400 rounded-2xl flex items-center justify-center shadow-md dark:shadow-[0_0_30px_rgba(34,211,238,0.15)] border border-slate-200/60 dark:border-white/5 flex-shrink-0">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="w-8 h-8"><path d="M21.42 10.922a1 1 0 0 0-.019-1.838L12.83 5.18a2 2 0 0 0-1.66 0L2.6 9.08a1 1 0 0 0 0 1.832l8.57 3.908a2 2 0 0 0 1.66 0z"></path><path d="M22 10v6"></path><path d="M6 12.5V16a6 3 0 0 0 12 0v-3.5"></path></svg>
              </div>
              <div>
                <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                  {t('title')}
                </h2>
                <p className="text-sm font-medium text-slate-500 dark:text-white/60 leading-snug mt-1">
                  {t('subtitle')}
                </p>
              </div>
            </div>

            <div className="space-y-6">
              <a href={googleLoginUrl ?? withBasePath('/login')} className="w-full relative group/btn block">
                <div className="absolute -inset-0.5 bg-gradient-to-r from-ocean-cyan to-blue-500 rounded-[14px] blur opacity-20 dark:opacity-30 group-hover/btn:opacity-50 dark:group-hover/btn:opacity-70 transition duration-500"></div>
                <div className="relative w-full flex items-center justify-center gap-3 bg-white dark:bg-[#0a0f1c] border border-slate-200 dark:border-white/10 text-slate-800 dark:text-white py-4 px-4 rounded-[14px] shadow-sm transition-all font-bold overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-slate-100 dark:via-white/10 to-transparent -translate-x-[100%] group-hover/btn:translate-x-[100%] transition-transform duration-1000"></div>
                  <svg className="w-5 h-5 group-hover/btn:scale-110 transition-transform relative z-10" viewBox="0 0 24 24">
                    <path fill="currentColor" className="dark:fill-white fill-slate-800" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                  </svg>
                  <span className="relative z-10">{t('button')}</span>
                </div>
              </a>

              <div className="flex items-start gap-3 text-[11.5px] font-bold uppercase tracking-wider text-ocean-cyan dark:text-cyan-50 bg-blue-50/50 dark:bg-cyan-950/40 px-5 py-4 rounded-[14px] border border-blue-100/50 dark:border-cyan-800/50">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5 flex-shrink-0 mt-0.5 text-ocean-cyan dark:text-cyan-400"><circle cx="12" cy="12" r="10"></circle><line x1="12" x2="12" y1="8" y2="12"></line><line x1="12" x2="12.01" y1="16" y2="16"></line></svg>
                <span className="text-left leading-tight text-slate-600 dark:text-cyan-50/80 mt-0.5">{t('warning')}</span>
              </div>
            </div>
          </div>

          <div className="mt-8 text-center text-xs font-medium text-slate-400 dark:text-white/30">
            © 2026 MARSYS · UCN Coquimbo
          </div>
        </div>
      </div>
    </div>
  );
}
