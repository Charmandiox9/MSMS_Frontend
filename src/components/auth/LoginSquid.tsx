'use client';

import dynamic from 'next/dynamic';

const Hero3D = dynamic(() => import('@/components/landing/Hero3D'), { ssr: false });

export default function LoginSquid() {
  return (
    <div aria-hidden="true" className="absolute inset-y-0 -left-[65%] z-[1] w-[180%] lg:left-0 lg:w-[72.5%] pointer-events-none opacity-70 dark:opacity-80">
      <Hero3D />
    </div>
  );
}
