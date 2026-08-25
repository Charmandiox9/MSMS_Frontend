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
    setMounted(true);
    // Verificar si existe la cookie 'token'
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
    <nav className="flex items-center justify-between px-6 py-4 bg-[#1e3a8a] text-white border-b border-white/10 shadow-sm relative z-50">
      <div className="flex flex-1 items-center">
        <Link href="/" className="flex items-center gap-2">
          <span className="text-2xl font-black tracking-tight">SYSMAR</span>
        </Link>
      </div>
      
      <div className="hidden md:flex flex-1 justify-center space-x-6">
        <Link href="/about" className="text-sm font-medium px-3 py-1.5 rounded-lg transition-colors text-white/70 hover:bg-white/10 hover:text-white">
          {t('about')}
        </Link>
        <Link href="/fcm" className="text-sm font-medium px-3 py-1.5 rounded-lg transition-colors text-white/70 hover:bg-white/10 hover:text-white">
          {t('fcm')}
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
            <Link href="/dashboard" className="flex items-center px-4 py-2 text-sm font-bold bg-white text-[#1e3a8a] rounded-lg hover:bg-gray-100 transition-colors shadow-sm">
              Dashboard
            </Link>
            <button onClick={handleLogout} className="flex items-center px-4 py-2 text-sm font-bold bg-red-500/10 text-red-100 border border-red-500/20 rounded-lg hover:bg-red-500/20 hover:text-white transition-colors shadow-sm">
              Cerrar Sesión
            </button>
          </div>
        ) : (
          <Link href="/login" className="hidden md:flex items-center px-4 py-2 text-sm font-bold bg-white text-[#1e3a8a] rounded-lg hover:bg-gray-100 transition-colors shadow-sm">
            {t('login')}
          </Link>
        )}
      </div>
    </nav>
  );
}

