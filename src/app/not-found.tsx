"use client";

import Link from 'next/link';
import { ArrowLeft, Home } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function GlobalNotFound() {
  const router = useRouter();

  const handleBack = () => {
    if (window.history.length > 2) {
      router.back();
    } else {
      router.push('/');
    }
  };

  return (
    <html>
      <body className="institutional-theme min-h-screen bg-background text-foreground antialiased">
        <div className="relative flex min-h-screen w-full flex-grow flex-col items-center justify-center overflow-hidden bg-background text-foreground selection:bg-selection transition-colors duration-500">
          
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

          <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none flex justify-center items-center">
            <div className="absolute h-[80vw] w-[80vw] max-h-[800px] max-w-[800px] animate-[pulse_15s_ease-in-out_infinite] rounded-full bg-primary/5 blur-[100px] md:blur-[150px]"></div>
            <div className="absolute h-[60vw] w-[60vw] max-h-[600px] max-w-[600px] translate-y-20 animate-[pulse_10s_ease-in-out_infinite_reverse] rounded-full bg-selection/60 blur-[80px] md:blur-[120px]"></div>
          </div>

          <div className="pointer-events-none absolute bottom-0 left-0 right-0 z-0 h-[40vh] overflow-hidden opacity-30 transition-opacity duration-500 md:h-[50vh]">
            <svg className="absolute w-[200%] h-[150%] bottom-[-20%] left-[-50%] wave-bottom-1" viewBox="0 0 800 800" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none">
              <path d="M0 400C100 300 200 500 400 400C600 300 700 500 800 400L800 800L0 800Z" fill="var(--selection)" opacity="0.3" />
            </svg>
            <svg className="absolute w-[200%] h-[150%] bottom-[-20%] left-[-50%] wave-bottom-2" viewBox="0 0 800 800" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none">
              <path d="M0 500C200 400 300 600 500 500C700 400 800 600 800 500L800 800L0 800Z" fill="var(--primary)" opacity="0.2" />
            </svg>
          </div>

          <div className="relative z-10 flex flex-col items-center text-center max-w-3xl px-6 w-full">
            
            <h1 className="relative z-0 mb-0 select-none bg-gradient-to-b from-primary/10 to-transparent bg-clip-text text-[12rem] font-black leading-none tracking-tighter text-transparent animate-in slide-in-from-bottom-10 duration-1000 fade-in md:text-[18rem]">
              404
            </h1>
            
            <div className="flex flex-col items-center -mt-16 md:-mt-32 animate-in slide-in-from-bottom-10 duration-1000 fade-in delay-200 fill-mode-both relative z-10">
              <h2 className="mb-6 text-3xl font-bold tracking-tight text-foreground md:text-5xl">
                Página No Encontrada
              </h2>
              
              <p className="mx-auto mb-10 max-w-lg text-lg font-medium leading-relaxed text-muted-foreground md:text-xl">
                La página que buscas ha sido movida, eliminada o simplemente no existe. / The page you are looking for does not exist.
              </p>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-4 w-full sm:w-auto">
                <button 
                  onClick={handleBack}
                  className="group/btn inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border border-border bg-card px-8 py-4 font-semibold text-foreground shadow-sm transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus sm:w-auto"
                >
                  <ArrowLeft className="w-5 h-5 group-hover/btn:-translate-x-1 transition-transform" />
                  <span>Regresar / Go Back</span>
                </button>

                <Link href="/" className="group/btn relative inline-flex min-h-11 w-full items-center justify-center gap-2 overflow-hidden rounded-xl bg-primary px-8 py-4 font-semibold text-primary-foreground transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus sm:w-auto">
                  <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-primary-foreground/10 to-transparent transition-transform duration-700 group-hover/btn:translate-x-full" aria-hidden="true"></div>
                  <Home className="relative z-10 h-5 w-5 text-primary-foreground/80 transition-transform group-hover/btn:-translate-y-0.5" aria-hidden="true" />
                  <span className="relative z-10">Volver al inicio / Home</span>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </body>
    </html>
  );
}
