'use client';

import dynamic from 'next/dynamic';

const Hero3D = dynamic(() => import('@/components/landing/Hero3D'), { ssr: false });

export default function LoginSquid() {
  return (
    <div className="absolute inset-y-0 left-0 z-[1] w-[145%] pointer-events-none opacity-70 dark:opacity-80">
      <Hero3D />
    </div>
  );
}
