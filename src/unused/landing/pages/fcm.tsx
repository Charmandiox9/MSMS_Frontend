import { getTranslations } from "next-intl/server";
import { useTranslations } from "next-intl";
import type { Metadata } from "next";
import {
  Building2,
  BookOpen,
  ExternalLink,
  Laptop,
  Waves,
  type LucideIcon,
} from "lucide-react";
import ScrollReveal from "@/components/ui/ScrollReveal";
import LazySection from "@/components/ui/LazySection";

interface LinkCard {
  id: "ucn" | "fcm" | "campus";
  url: string;
  icon: LucideIcon;
  iconColor: string;
  iconBg: string;
  hoverBorder: string;
  topLine: string;
}

interface CareerCard {
  id: "biologia" | "acuicultura" | "prevencion";
  url: string;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Metadata.fcm" });
  return {
    title: t("title"),
    description: t("description"),
  };
}

export default function FCMPage() {
  const t = useTranslations("FCM");

  const linkCards: LinkCard[] = [
    {
      id: "ucn",
      url: "https://www.ucn.cl",
      icon: Building2,
      iconColor: "text-ocean-cyan",
      iconBg: "bg-ocean-cyan/10",
      hoverBorder: "hover:border-ocean-cyan/40",
      topLine: "via-ocean-cyan/60",
    },
    {
      id: "fcm",
      url: "https://www.ucn.cl/universidad/facultades-escuelas-y-departamentos/facultad-de-ciencias-del-mar/",
      icon: Waves,
      iconColor: "text-ucn-gold",
      iconBg: "bg-ucn-gold/10",
      hoverBorder: "hover:border-ucn-gold/40",
      topLine: "via-ucn-gold/60",
    },
    {
      id: "campus",
      url: "https://campusvirtual.ucn.cl",
      icon: Laptop,
      iconColor: "text-purple-500",
      iconBg: "bg-purple-500/10",
      hoverBorder: "hover:border-purple-500/40",
      topLine: "via-purple-500/60",
    },
  ];

  const careers: CareerCard[] = [
    { id: "biologia", url: "https://www.ucn.cl/universidad/facultades-escuelas-y-departamentos/facultad-de-ciencias-del-mar/departamento-de-biologia-marina/" },
    { id: "acuicultura", url: "https://www.ucn.cl/universidad/facultades-escuelas-y-departamentos/facultad-de-ciencias-del-mar/departamento-de-acuicultura/" },
    { id: "prevencion", url: "https://www.ucn.cl/universidad/facultades-escuelas-y-departamentos/facultad-de-ciencias-del-mar/escuela-de-prevencion-de-riesgo-y-medio-ambiente/" },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-background overflow-x-hidden selection:bg-ocean-cyan/20">
      <section className="relative py-28 md:py-36 px-6 overflow-hidden border-b border-border/50">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-ocean-cyan/15 via-transparent to-transparent pointer-events-none z-0"></div>

        {/* Sonar: firma visual de la página */}
        <div aria-hidden className="pointer-events-none absolute left-1/2 top-1/2 z-0">
          {[0, 1.8, 3.6].map((delay) => (
            <span
              key={delay}
              className="sonar-ring absolute -left-[11rem] -top-[11rem] h-[22rem] w-[22rem] rounded-full border border-ocean-cyan/20 dark:border-ocean-cyan/30"
              style={{ animationDelay: `${delay}s` }}
            ></span>
          ))}
        </div>

        <div className="max-w-[1400px] mx-auto text-center relative z-10 flex flex-col items-center">
          <div className="hero-fade-up mb-7 flex items-center justify-center" style={{ animationDelay: "0.05s" }}>
            <span className="inline-flex items-center gap-2.5 text-xs font-bold uppercase tracking-[0.2em] text-ocean-cyan bg-ocean-cyan/10 px-4 py-1.5 rounded-full border border-ocean-cyan/20 shadow-sm">
              <span className="h-1.5 w-1.5 rounded-full bg-ocean-cyan animate-pulse"></span>
              {t("badge")}
            </span>
          </div>

          <h1 className="hero-line-mask text-5xl md:text-7xl font-black tracking-tighter text-foreground mb-7">
            <span>{t("title")}</span>
          </h1>

          <p className="hero-fade-up text-lg md:text-2xl text-muted-foreground font-medium max-w-2xl mx-auto leading-relaxed" style={{ animationDelay: "0.45s" }}>
            {t("subtitle")}
          </p>
        </div>
      </section>

      <main className="flex-grow max-w-[1200px] mx-auto w-full px-6 py-20 space-y-28">
        <LazySection className="max-w-4xl mx-auto">
          <ScrollReveal className="rounded-[2rem] border border-border/50 bg-card/50 backdrop-blur-sm p-8 md:p-12 text-center shadow-sm transition-[border-color,background-color,box-shadow] duration-300 ease-premium hover:border-ocean-cyan/30 hover:bg-card hover:shadow-xl">
            <span className="mb-4 inline-block text-xs font-bold uppercase tracking-[0.25em] text-ocean-cyan">
              {t("eyebrows.faculty")}
            </span>
            <h2 className="mb-6 text-3xl md:text-4xl font-black tracking-tight text-foreground">{t("whoAreWe")}</h2>
            <p className="text-muted-foreground leading-relaxed text-lg font-medium">
              {t("whoAreWeDesc")}
            </p>
          </ScrollReveal>
        </LazySection>

        <LazySection>
          <ScrollReveal className="text-center mb-14">
            <span className="mb-4 inline-block text-xs font-bold uppercase tracking-[0.25em] text-ocean-cyan">
              {t("eyebrows.resources")}
            </span>
            <h2 className="text-3xl md:text-4xl font-black tracking-tight text-foreground">{t("links")}</h2>
          </ScrollReveal>
          <ScrollReveal stagger className="grid md:grid-cols-3 gap-6">
            {linkCards.map((link) => {
              const Icon = link.icon;
              return (
                <a
                  key={link.id}
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`group relative flex flex-col items-center justify-center overflow-hidden rounded-[2rem] border border-border/50 bg-card/50 backdrop-blur-sm p-8 shadow-sm transition-[transform,border-color,background-color,box-shadow] duration-300 ease-premium hover:-translate-y-1 hover:bg-card hover:shadow-xl active:scale-[0.98] ${link.hoverBorder}`}
                >
                  <div
                    className={`absolute inset-x-0 top-0 h-px origin-left scale-x-0 bg-gradient-to-r from-transparent to-transparent transition-transform duration-500 ease-premium group-hover:scale-x-100 ${link.topLine}`}
                  ></div>
                  <div
                    className={`mb-5 flex h-16 w-16 items-center justify-center rounded-[1rem] transition-transform duration-300 ease-premium group-hover:scale-110 ${link.iconBg} ${link.iconColor}`}
                  >
                    <Icon className="h-8 w-8" />
                  </div>
                  <span className="mb-2 text-center text-xl font-bold tracking-tight text-foreground transition-colors duration-300 group-hover:text-ocean-cyan">
                    {t(`linksCards.${link.id}.title`)}
                  </span>
                  <div className="flex items-center text-sm font-medium text-foreground/50 transition-colors duration-300 group-hover:text-ocean-cyan">
                    <span>{t(`linksCards.${link.id}.desc`)}</span>
                    <ExternalLink className="ml-1 h-4 w-4 -translate-x-2 opacity-0 transition-[transform,opacity] duration-300 ease-premium group-hover:translate-x-0 group-hover:opacity-100" />
                  </div>
                </a>
              );
            })}
          </ScrollReveal>
        </LazySection>

        <LazySection>
          <ScrollReveal className="text-center mb-14">
            <span className="mb-4 inline-block text-xs font-bold uppercase tracking-[0.25em] text-ocean-cyan">
              {t("eyebrows.education")}
            </span>
            <h2 className="text-3xl md:text-4xl font-black tracking-tight text-foreground">{t("careers")}</h2>
          </ScrollReveal>
          <ScrollReveal stagger className="grid md:grid-cols-3 gap-6">
            {careers.map((career) => (
              <a
                key={career.id}
                href={career.url}
                target="_blank"
                rel="noopener noreferrer"
                className="group flex h-full flex-col rounded-[2rem] border border-border/50 bg-card/50 backdrop-blur-sm p-8 shadow-sm transition-[transform,border-color,background-color,box-shadow] duration-300 ease-premium hover:-translate-y-1 hover:border-ocean-cyan/30 hover:bg-card hover:shadow-xl active:scale-[0.98] focus-visible:ring-2 focus-visible:ring-ocean-cyan focus-visible:outline-none"
              >
                <div className="mb-6 self-start rounded-xl bg-ocean-cyan/10 p-4 text-ocean-cyan transition-transform duration-300 ease-premium group-hover:-rotate-6">
                  <BookOpen className="h-8 w-8" />
                </div>
                <div className="flex flex-grow flex-col justify-between">
                  <h3 className="mb-6 text-xl font-bold leading-tight tracking-tight text-foreground transition-colors duration-300 group-hover:text-ocean-cyan">
                    {t(`careersCards.${career.id}.title`)}
                  </h3>
                  <div className="flex items-center justify-between text-sm font-bold text-ocean-cyan opacity-80 transition-opacity duration-300 group-hover:opacity-100">
                    <span>{t(`careersCards.${career.id}.desc`)}</span>
                    <ExternalLink className="h-5 w-5 transition-transform duration-300 ease-premium group-hover:translate-x-1" />
                  </div>
                </div>
              </a>
            ))}
          </ScrollReveal>
        </LazySection>
      </main>
    </div>
  );
}
// Página pública conservada fuera de las rutas activas.
