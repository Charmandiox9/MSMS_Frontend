"use client";

import { Link, usePathname, useRouter } from '@/i18n/routing';
import { useTranslations, useLocale } from 'next-intl';
import { useTheme } from 'next-themes';
import { Sun, Moon } from 'lucide-react';
import { useEffect, useState } from 'react';

export default function Navbar() {
  const t = useTranslations('Navigation');
  const { theme, setTheme, systemTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // eslint-disable-next-line
    setMounted(true);
    if (document.cookie.includes('token=')) {
      setIsLoggedIn(true);
    }
  }, []);

  const handleLogout = () => {
    document.cookie = "token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
    setIsLoggedIn(false);
    router.push('/');
    router.refresh();
  };

  const toggleTheme = () => {
    const currentTheme = theme === 'system' ? systemTheme : theme;
    setTheme(currentTheme === 'dark' ? 'light' : 'dark');
  };

  const toggleLanguage = () => {
    const nextLocale = locale === 'es' ? 'en' : 'es';
    router.replace(pathname, { locale: nextLocale });
  };

  return (
    <nav className="flex items-center justify-between px-6 py-4 bg-ucn-navy text-white border-b border-ucn-navy shadow-sm relative z-50">
      <div className="flex flex-1 items-center">
        <Link href="/" className="flex items-center gap-2">
          <span className="text-2xl font-black tracking-tight">MARSYS</span>
        </Link>
      </div>
      
      <div className="hidden md:flex flex-1 justify-center space-x-6">
        <Link href="/about" className={`relative text-sm font-medium px-3 py-1.5 rounded-lg transition-colors ${pathname === '/about' ? 'text-white' : 'text-white/70 hover:bg-white/10 hover:text-white'}`}>
          {t('about')}
          {pathname === '/about' && (
            <span className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-1/2 h-0.5 bg-ocean-cyan rounded-full shadow-[0_0_8px_rgba(14,165,233,0.8)] animate-in fade-in zoom-in duration-300"></span>
          )}
        </Link>
        <Link href="/fcm" className={`relative text-sm font-medium px-3 py-1.5 rounded-lg transition-colors ${pathname === '/fcm' ? 'text-white' : 'text-white/70 hover:bg-white/10 hover:text-white'}`}>
          {t('fcm')}
          {pathname === '/fcm' && (
            <span className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-1/2 h-0.5 bg-ocean-cyan rounded-full shadow-[0_0_8px_rgba(14,165,233,0.8)] animate-in fade-in zoom-in duration-300"></span>
          )}
        </Link>
      </div>

      <div className="flex flex-1 items-center justify-end space-x-4">
        {/* Theme Toggle */}
        <button 
          onClick={toggleTheme}
          className="flex items-center justify-center w-8 h-8 rounded-lg hover:bg-white/10 text-white/70 hover:text-white transition-colors"
          aria-label="Toggle Theme"
        >
          {mounted && (theme === 'dark' || (theme === 'system' && systemTheme === 'dark')) 
            ? <Sun className="w-5 h-5 text-amber-300" /> 
            : <Moon className="w-5 h-5" />}
        </button>

        {/* Language Toggle */}
        <button 
          onClick={toggleLanguage}
          className="flex items-center justify-center w-8 h-8 rounded-lg hover:bg-white/10 text-white/70 hover:text-white transition-colors"
          aria-label="Toggle Language"
        >
          <div className="text-[10px] font-black w-6 h-6 flex items-center justify-center border border-white/20 rounded-md uppercase">
            {locale}
          </div>
        </button>

        {isLoggedIn ? (
          <div className="hidden md:flex items-center gap-3">
            <Link href="/dashboard" className="flex items-center px-4 py-2 text-sm font-bold bg-white/10 text-white rounded-lg hover:bg-white/20 transition-colors shadow-sm">
              {t('dashboard')}
            </Link>
            <button onClick={handleLogout} className="flex items-center px-4 py-2 text-sm font-bold bg-coral-red text-white rounded-lg hover:bg-coral-red/90 transition-colors shadow-sm">
              {t('logout')}
            </button>
          </div>
        ) : (
          <Link href="/login" className="hidden md:flex items-center px-4 py-2 text-sm font-bold bg-ocean-cyan text-white rounded-lg hover:bg-ocean-cyan/90 transition-colors shadow-sm">
            {t('login')}
          </Link>
        )}
      </div>
    </nav>
  );
}

