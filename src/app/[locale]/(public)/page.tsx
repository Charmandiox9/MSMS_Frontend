import HeroSection from '@/components/home/HeroSection';
import KpiSection from '@/components/home/KpiSection';
import FeaturesSection from '@/components/home/FeaturesSection';
import ProjectsSection from '@/components/home/ProjectsSection';

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
