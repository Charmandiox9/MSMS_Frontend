import { useTranslations } from 'next-intl';
import { ArrowLeft } from 'lucide-react';
import { Link } from '@/i18n/routing';

export default function LoginPage() {
  const t = useTranslations('Login');

  return (
    <div className="min-h-[85vh] flex items-center justify-center bg-background relative overflow-hidden px-4">
      {/* Background effect matching PROJEIC style */}
      <div className="absolute top-0 inset-x-0 h-full bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/10 via-background to-background pointer-events-none z-0"></div>
      
      <div className="w-full max-w-[420px] relative z-10">
        
        <Link href="/" className="inline-flex items-center gap-2 text-sm font-semibold text-foreground/60 hover:text-foreground transition-colors mb-6 group">
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          {t('back')}
        </Link>

        <div className="bg-background border border-foreground/10 rounded-[2rem] shadow-xl p-8 sm:p-10 flex flex-col items-center text-center">
          
          {/* Logo / Badge */}
          <div className="w-16 h-16 bg-primary/10 text-primary rounded-[1.25rem] flex items-center justify-center mb-6">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="w-8 h-8"><path d="M21.42 10.922a1 1 0 0 0-.019-1.838L12.83 5.18a2 2 0 0 0-1.66 0L2.6 9.08a1 1 0 0 0 0 1.832l8.57 3.908a2 2 0 0 0 1.66 0z"></path><path d="M22 10v6"></path><path d="M6 12.5V16a6 3 0 0 0 12 0v-3.5"></path></svg>
          </div>

          <h1 className="text-2xl font-black text-foreground mb-3 tracking-tight">
            {t('title')}
          </h1>
          
          <p className="text-sm font-medium text-foreground/70 mb-8 leading-relaxed">
            {t('subtitle')}
          </p>

          <a href="http://localhost:3001/api/auth/google" className="w-full flex items-center justify-center gap-3 bg-background border-2 border-foreground/10 hover:border-foreground/20 hover:bg-foreground/5 text-foreground py-3.5 px-4 rounded-[1rem] shadow-sm hover:shadow-md transition-all font-bold group">
            <svg className="w-5 h-5 group-hover:scale-110 transition-transform" viewBox="0 0 24 24">
              <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
            {t('button')}
          </a>

          <div className="mt-8 flex items-center justify-center gap-2 text-[11px] font-bold uppercase tracking-wider text-foreground/40 bg-foreground/5 px-4 py-2 rounded-lg border border-foreground/5">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5"><circle cx="12" cy="12" r="10"></circle><line x1="12" x2="12" y1="8" y2="12"></line><line x1="12" x2="12.01" y1="16" y2="16"></line></svg>
            {t('warning')}
          </div>
        </div>

        <div className="mt-8 text-center text-xs font-semibold text-foreground/40">
          © 2026 SYSMAR · UCN Coquimbo
        </div>
      </div>
    </div>
  );
}
