import { getTranslations } from "next-intl/server";
import { useTranslations } from "next-intl";
import type { Metadata } from "next";
import Image from "next/image";
import {
  GitBranch,
  History,
  Users,
  Zap,
  type LucideIcon,
} from "lucide-react";
import ScrollReveal from "@/components/ScrollReveal";
import LazySection from "@/components/LazySection";

interface ProposalCard {
  id: "transparency" | "efficiency" | "collaboration";
  icon: LucideIcon;
  iconColor: string;
  iconBg: string;
  hoverBorder: string;
  topLine: string;
}

interface TechItem {
  id:
    | "nextjs"
    | "nestjs"
    | "postgresql"
    | "prisma"
    | "oauth"
    | "nginx"
    | "redis"
    | "podman"
    | "graphql"
    | "rest"
    | "jenkins";
  url: string;
  iconUrl: string;
  invertDark?: boolean;
}

interface Dev {
  name: string;
  role: string;
  minor: string;
  github: string;
  linkedin: string;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Metadata.about" });
  return {
    title: t("title"),
    description: t("description"),
  };
}

export default function AboutPage() {
  const t = useTranslations("About");

  const proposalCards: ProposalCard[] = [
    {
      id: "transparency",
      icon: History,
      iconColor: "text-ocean-cyan",
      iconBg: "bg-ocean-cyan/10",
      hoverBorder: "hover:border-ocean-cyan/40",
      topLine: "via-ocean-cyan/60",
    },
    {
      id: "efficiency",
      icon: Zap,
      iconColor: "text-ucn-gold",
      iconBg: "bg-ucn-gold/10",
      hoverBorder: "hover:border-ucn-gold/40",
      topLine: "via-ucn-gold/60",
    },
    {
      id: "collaboration",
      icon: Users,
      iconColor: "text-purple-500",
      iconBg: "bg-purple-500/10",
      hoverBorder: "hover:border-purple-500/40",
      topLine: "via-purple-500/60",
    },
  ];

  const techItems: TechItem[] = [
    { id: "nextjs", url: "https://nextjs.org", iconUrl: "https://cdn.simpleicons.org/nextdotjs/000000", invertDark: true },
    { id: "nestjs", url: "https://nestjs.com", iconUrl: "https://cdn.simpleicons.org/nestjs/E0234E" },
    { id: "postgresql", url: "https://postgresql.org", iconUrl: "https://cdn.simpleicons.org/postgresql/4169E1" },
    { id: "prisma", url: "https://prisma.io", iconUrl: "https://cdn.simpleicons.org/prisma/000000", invertDark: true },
    { id: "oauth", url: "https://oauth.net", iconUrl: "https://cdn.simpleicons.org/google/000000", invertDark: true },
    { id: "nginx", url: "https://nginx.org", iconUrl: "https://cdn.simpleicons.org/nginx/009639" },
    { id: "redis", url: "https://redis.io", iconUrl: "https://cdn.simpleicons.org/redis/FF4438" },
    { id: "podman", url: "https://podman.io", iconUrl: "https://cdn.simpleicons.org/podman/892CA0" },
    { id: "graphql", url: "https://graphql.org", iconUrl: "https://cdn.simpleicons.org/graphql/E10098" },
    { id: "rest", url: "https://swagger.io", iconUrl: "https://cdn.simpleicons.org/swagger/000000", invertDark: true },
    { id: "jenkins", url: "https://www.jenkins.io", iconUrl: "https://cdn.simpleicons.org/jenkins/D24939" },
  ];

  const devs: Dev[] = [
    {
      name: "Martín Castillo",
      role: t("roles.iti"),
      minor: t("roles.minor_sec"),
      github: "https://github.com/Marton1123",
      linkedin: "https://www.linkedin.com/in/martin-castillo-t",
    },
    {
      name: "Daniel Durán",
      role: t("roles.iti"),
      minor: t("roles.minor_arch"),
      github: "https://github.com/Charmandiox9",
      linkedin: "https://www.linkedin.com/in/daniel-durán-garcía/",
    },
    {
      name: "Diego Contreras",
      role: t("roles.iti"),
      minor: t("roles.minor_arch"),
      github: "https://github.com/DiegoContreras-dev",
      linkedin: "/",
    },
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
        <LazySection className="text-center max-w-3xl mx-auto">
          <ScrollReveal className="mb-10">
            <span className="mb-4 inline-block text-xs font-bold uppercase tracking-[0.25em] text-ocean-cyan">
              {t("eyebrows.platform")}
            </span>
            <h2 className="text-3xl md:text-4xl font-black tracking-tight text-foreground">{t("whatIs")}</h2>
          </ScrollReveal>
          <ScrollReveal delay={100}>
            <p className="text-muted-foreground leading-relaxed text-lg font-medium">
              {t("whatIsDesc")}
            </p>
          </ScrollReveal>
        </LazySection>

        <LazySection>
          <ScrollReveal className="text-center mb-14">
            <span className="mb-4 inline-block text-xs font-bold uppercase tracking-[0.25em] text-ocean-cyan">
              {t("eyebrows.value")}
            </span>
            <h2 className="text-3xl md:text-4xl font-black tracking-tight text-foreground">{t("proposal")}</h2>
          </ScrollReveal>
          <ScrollReveal stagger className="grid md:grid-cols-3 gap-6">
            {proposalCards.map((card) => {
              const Icon = card.icon;
              return (
                <div
                  key={card.id}
                  className={`group relative overflow-hidden rounded-3xl border border-border/50 bg-card/50 backdrop-blur-sm p-8 transition-[transform,border-color,box-shadow] duration-300 ease-premium hover:-translate-y-1.5 hover:shadow-xl ${card.hoverBorder}`}
                >
                  <div
                    className={`absolute inset-x-0 top-0 h-px origin-left scale-x-0 bg-gradient-to-r from-transparent to-transparent transition-transform duration-500 ease-premium group-hover:scale-x-100 ${card.topLine}`}
                  ></div>
                  <div
                    className={`mb-6 flex h-14 w-14 items-center justify-center rounded-2xl transition-transform duration-300 ease-premium group-hover:scale-110 ${card.iconBg} ${card.iconColor}`}
                  >
                    <Icon className="h-7 w-7" />
                  </div>
                  <h3 className="mb-3 text-xl font-bold tracking-tight text-foreground">
                    {t(`proposalCards.${card.id}.title`)}
                  </h3>
                  <p className="text-sm leading-relaxed font-medium text-foreground/60">
                    {t(`proposalCards.${card.id}.desc`)}
                  </p>
                </div>
              );
            })}
          </ScrollReveal>
        </LazySection>

        <LazySection>
          <ScrollReveal className="text-center mb-14">
            <span className="mb-4 inline-block text-xs font-bold uppercase tracking-[0.25em] text-ocean-cyan">
              {t("eyebrows.stack")}
            </span>
            <h2 className="text-3xl md:text-4xl font-black tracking-tight text-foreground">{t("tech")}</h2>
          </ScrollReveal>
          <ScrollReveal stagger className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-5">
            {techItems.map((tech) => (
              <a
                key={tech.id}
                href={tech.url}
                target="_blank"
                rel="noopener noreferrer"
                className="group flex flex-col items-center justify-center rounded-3xl border border-border/50 bg-card/30 backdrop-blur-sm p-6 text-center transition-[transform,border-color,background-color,box-shadow] duration-300 ease-premium hover:-translate-y-1 hover:border-ocean-cyan/30 hover:bg-card hover:shadow-lg active:scale-[0.98]"
              >
                <Image
                  src={tech.iconUrl}
                  alt={`Logo de ${t(`techItems.${tech.id}.name`)}`}
                  width={48}
                  height={48}
                  unoptimized
                  className={`mb-4 h-12 w-12 opacity-70 transition-opacity duration-300 group-hover:opacity-100 ${tech.invertDark ? "dark:invert" : ""}`}
                />
                <span className="mb-1 text-sm font-bold text-foreground transition-colors duration-300 group-hover:text-ocean-cyan">{t(`techItems.${tech.id}.name`)}</span>
                <span className="text-[11px] font-semibold uppercase tracking-wider text-foreground/50">{t(`techItems.${tech.id}.desc`)}</span>
              </a>
            ))}
          </ScrollReveal>
        </LazySection>

        <LazySection>
          <ScrollReveal className="text-center mb-14">
            <span className="mb-4 inline-block text-xs font-bold uppercase tracking-[0.25em] text-ocean-cyan">
              {t("eyebrows.team")}
            </span>
            <h2 className="text-3xl md:text-4xl font-black tracking-tight text-foreground">{t("devs")}</h2>
          </ScrollReveal>
          <ScrollReveal stagger className="grid md:grid-cols-3 gap-6 max-w-6xl mx-auto">
            {devs.map((dev) => (
              <div
                key={dev.name}
                className="group relative flex flex-col justify-between overflow-hidden rounded-[2rem] border border-border/50 bg-card/50 backdrop-blur-sm p-8 shadow-sm transition-[transform,border-color,box-shadow] duration-300 ease-premium hover:-translate-y-1.5 hover:border-ocean-cyan/30 hover:shadow-xl"
              >
                <div className="absolute inset-x-0 top-0 h-24 rounded-t-[2rem] bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-ocean-cyan/20 via-muted to-muted"></div>

                <div className="relative z-10 mb-6 flex flex-col items-center pt-4">
                  <div className="mb-5 h-28 w-28 rounded-full bg-gradient-to-tr from-ocean-cyan/60 via-ocean-cyan/20 to-ucn-gold/60 p-[2px] transition-transform duration-300 ease-premium group-hover:scale-105">
                    <Image
                      src={`${dev.github}.png`}
                      alt={`Avatar de ${dev.name}`}
                      width={112}
                      height={112}
                      unoptimized
                      className="h-full w-full rounded-full border-2 border-card bg-muted object-cover"
                    />
                  </div>
                  <h3 className="mb-1 text-center text-2xl font-black tracking-tight text-foreground">{dev.name}</h3>
                  <p className="text-center text-sm font-semibold text-foreground/60">{dev.role}</p>
                  <span className="mt-4 rounded-full bg-ocean-cyan/10 px-3 py-1 text-center text-xs font-bold uppercase tracking-wider text-ocean-cyan">{dev.minor}</span>
                </div>

                {(dev.github.startsWith("http") || dev.linkedin.startsWith("http")) && (
                  <div className="relative z-10 mt-4 flex items-center justify-center gap-4 border-t border-border pt-6">
                    {dev.github.startsWith("http") && (
                      <a
                        href={dev.github}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-transparent bg-muted/50 py-3 text-sm font-bold text-foreground/80 transition-[background-color,border-color,color,transform] duration-200 ease-premium hover:border-border/50 hover:bg-muted hover:text-foreground active:scale-[0.98]"
                      >
                        <GitBranch className="h-4 w-4" />
                        <span>GitHub</span>
                      </a>
                    )}
                    {dev.linkedin.startsWith("http") && (
                      <a
                        href={dev.linkedin}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-transparent bg-ocean-cyan/10 py-3 text-sm font-bold text-ocean-cyan transition-[background-color,border-color,transform] duration-200 ease-premium hover:border-ocean-cyan/20 hover:bg-ocean-cyan/20 active:scale-[0.98]"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4" aria-hidden="true"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"></path><rect width="4" height="12" x="2" y="9"></rect><circle cx="4" cy="4" r="2"></circle></svg>
                        <span>LinkedIn</span>
                      </a>
                    )}
                  </div>
                )}
              </div>
            ))}
          </ScrollReveal>
        </LazySection>
      </main>
    </div>
  );
}
