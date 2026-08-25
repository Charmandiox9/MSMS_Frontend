'use client';

import { useTranslations } from 'next-intl';
import { Link, usePathname, useRouter } from '@/i18n/routing';
import { LayoutDashboard, LogOut, Briefcase, Settings, Users, BookOpen } from 'lucide-react';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const t = useTranslations('Dashboard');
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = () => {
    document.cookie = "token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
    router.push('/');
    router.refresh();
  };

  const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Mis Proyectos', href: '/dashboard/projects', icon: Briefcase },
    { name: 'Laboratorios', href: '/dashboard/labs', icon: BookOpen },
    { name: 'Usuarios', href: '/dashboard/users', icon: Users },
    { name: 'Configuración', href: '/dashboard/settings', icon: Settings },
  ];

  return (
    <div className="flex min-h-screen bg-background">
      
      {/* Sidebar */}
      <aside className="w-64 border-r border-foreground/10 bg-foreground/5 flex flex-col">
        <div className="h-16 flex items-center px-6 border-b border-foreground/10">
          <Link href="/" className="font-black text-xl text-primary tracking-tight">
            SYSMAR
          </Link>
        </div>
        
        <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
          {navigation.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all font-medium text-sm ${
                  isActive 
                    ? 'bg-primary text-primary-foreground shadow-sm' 
                    : 'text-foreground/70 hover:bg-foreground/10 hover:text-foreground'
                }`}
              >
                <Icon className="w-5 h-5" />
                {item.name}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-foreground/10">
          <button onClick={handleLogout} className="flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all font-medium text-sm text-red-500 hover:bg-red-500/10 w-full">
            <LogOut className="w-5 h-5" />
            Cerrar Sesión
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-screen overflow-y-auto">
        <div className="h-16 flex items-center px-8 border-b border-foreground/10 bg-background/80 backdrop-blur sticky top-0 z-10 shrink-0">
          <div className="flex-1"></div>
          <div className="flex items-center gap-4">
            <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-sm">
              U
            </div>
          </div>
        </div>
        <div className="p-8">
          {children}
        </div>
      </main>
    </div>
  );
}
