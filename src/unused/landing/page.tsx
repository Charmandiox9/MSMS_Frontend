// Portada original conservada fuera de las rutas activas.
import HeroSection from '@/components/landing/sections/HeroSection';
import KpiSection from '@/components/landing/sections/KpiSection';
import FeaturesSection from '@/components/landing/sections/FeaturesSection';
import ProjectsSection from '@/components/landing/sections/ProjectsSection';

export default function LandingPage() {
  return (
    <div className="min-h-screen flex flex-col bg-background relative selection:bg-primary/20">
      <HeroSection />
      <main className="flex-grow z-10 pb-20">
        <KpiSection />
        <FeaturesSection />
        <ProjectsSection />
      </main>
    </div>
  );
}
