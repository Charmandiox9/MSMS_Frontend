'use client';

import dynamic from 'next/dynamic';
import { useEffect, useState } from 'react';

const Hero3D = dynamic(() => import('@/components/landing/Hero3D'), { ssr: false });
const DESKTOP_LOGIN_QUERY = '(min-width: 64rem)';

export default function LoginSquid() {
  const [isDesktop, setIsDesktop] = useState(false);

  useEffect(() => {
    const desktopQuery = window.matchMedia(DESKTOP_LOGIN_QUERY);
    const updateViewport = () => setIsDesktop(desktopQuery.matches);

    updateViewport();
    desktopQuery.addEventListener('change', updateViewport);
    return () => desktopQuery.removeEventListener('change', updateViewport);
  }, []);

  if (!isDesktop) return null;

  return (
    <div
      aria-hidden="true"
      className="login-squid-layer pointer-events-none absolute inset-y-0 left-0 z-[1] w-[72.5%] opacity-90"
    >
      <Hero3D />
    </div>
  );
}
