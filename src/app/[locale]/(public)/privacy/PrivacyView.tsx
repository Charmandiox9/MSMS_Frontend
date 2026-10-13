"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";
import {
  ArrowLeft,
  Building2,
  CheckCircle2,
  Cookie,
  Database,
  ExternalLink,
  Lock,
  Mail,
  Scale,
  ShieldCheck,
  UserCheck,
} from "lucide-react";
import LoginPreferences from "@/components/auth/LoginPreferences";

export default function PrivacyView() {
  const t = useTranslations("PrivacyPolicy");

  const sections = [
    { id: "intro", number: "01", titleKey: "intro_title", textKey: "intro_text", icon: ShieldCheck, color: "text-primary bg-primary/10" },
    { id: "collection", number: "02", titleKey: "collection_title", textKey: "collection_text", icon: Database, color: "text-secondary bg-secondary/10" },
    { id: "use", number: "03", titleKey: "use_title", textKey: "use_text", icon: Lock, color: "text-primary bg-primary/10" },
    { id: "arco", number: "04", titleKey: "arco_title", textKey: "arco_text", icon: UserCheck, color: "text-accent bg-accent/10" },
    { id: "cookies", number: "05", titleKey: "cookies_title", textKey: "cookies_text", icon: Cookie, color: "text-secondary bg-secondary/10" },
    { id: "contact", number: "06", titleKey: "contact_title", textKey: "contact_text", icon: Building2, color: "text-primary bg-primary/10" },
  ] as const;

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  return (
    <div className="relative min-h-screen flex flex-col bg-slate-50 dark:bg-[#020b18] text-foreground transition-colors duration-500 overflow-x-hidden selection:bg-ocean-cyan/30">
      
      {/* Luces y profundidad ambiental oceánica */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] right-[-10%] w-[60vw] h-[60vw] max-w-[700px] max-h-[700px] bg-cyan-200/40 dark:bg-cyan-900/15 rounded-full blur-[140px]"></div>
        <div className="absolute top-[35%] left-[-15%] w-[60vw] h-[60vw] max-w-[700px] max-h-[700px] bg-blue-200/35 dark:bg-blue-900/15 rounded-full blur-[140px]"></div>
        <div className="absolute bottom-[-10%] right-[10%] w-[50vw] h-[50vw] max-w-[600px] max-h-[600px] bg-sky-200/30 dark:bg-sky-950/20 rounded-full blur-[140px]"></div>
      </div>

      {/* Selector de idioma y tema en esquina superior */}
      <LoginPreferences />

      {/* Barra de cabecera con Call to Action de regreso */}
      <header className="relative z-10 w-full max-w-5xl mx-auto px-6 pt-8 pb-4 flex items-center justify-between gap-4">
        <Link
          href="/"
          className="inline-flex items-center gap-2.5 rounded-2xl bg-ocean-cyan hover:bg-ocean-cyan/90 text-white px-5 py-3 text-sm font-black shadow-md hover:shadow-lg hover:shadow-ocean-cyan/25 active:scale-95 transition-all group"
        >
          <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
          <span>{t("back_to_login")}</span>
        </Link>

        <div className="hidden sm:flex items-center gap-2 text-xs font-bold text-muted-foreground">
          <span>MARSYS</span>
          <span>·</span>
          <span>FCM UCN</span>
        </div>
      </header>

      {/* Contenedor editorial unificado del pliego legal */}
      <main className="relative z-10 flex-1 max-w-5xl w-full mx-auto px-6 py-6 pb-20">
        <article className="rounded-3xl border border-slate-200/80 dark:border-white/10 bg-white/95 dark:bg-[#0c1524]/95 backdrop-blur-2xl shadow-[0_20px_50px_rgba(0,0,0,0.05)] dark:shadow-[0_20px_60px_rgba(0,0,0,0.5)] p-6 sm:p-10 md:p-14 space-y-12">
          
          {/* Encabezado del documento */}
          <div className="border-b border-border/80 pb-10 space-y-5">
            <div className="inline-flex items-center gap-2 rounded-full border border-secondary/30 bg-secondary/10 px-4 py-1.5 text-xs font-bold text-secondary">
              <Scale className="h-4 w-4" aria-hidden="true" />
              <span>Ley N° 21.719 de Chile · Protección de Datos Personales</span>
            </div>

            <h1 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight text-foreground leading-[1.15]">
              {t("title")}
            </h1>

            <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-xs text-muted-foreground pt-1">
              <span className="font-semibold text-foreground/80">
                Facultad de Ciencias del Mar · Universidad Católica del Norte
              </span>
              <span>•</span>
              <span className="tabular-nums">{t("last_updated")}</span>
            </div>

            {/* Índice interactivo en botones para scroll suave sin modificar la URL con hash */}
            <nav aria-label="Índice de secciones" className="pt-4 flex flex-wrap gap-2">
              {sections.map((sec) => (
                <button
                  key={sec.id}
                  type="button"
                  onClick={() => scrollToSection(sec.id)}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-border/60 bg-muted/40 hover:bg-muted hover:border-border px-3 py-1 text-xs font-semibold text-muted-foreground hover:text-foreground transition-all cursor-pointer active:scale-95"
                >
                  <span className="text-2xs font-mono font-bold text-primary">{sec.number}</span>
                  <span>{t(sec.titleKey).replace(/^\d+\.\s*/, "")}</span>
                </button>
              ))}
            </nav>
          </div>

          {/* Cuerpo continuo del documento dividido por artículos */}
          <div className="space-y-12">
            {sections.map((sec, index) => {
              const Icon = sec.icon;
              return (
                <section
                  key={sec.id}
                  id={sec.id}
                  className="scroll-mt-8 space-y-4 pt-4 first:pt-0"
                >
                  {/* Título de la sección integrado con número de artículo */}
                  <div className="flex items-center gap-3">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl font-mono text-xs font-black text-foreground border border-border bg-muted/60">
                      {sec.number}
                    </span>
                    <div className={`p-2 rounded-xl shrink-0 ${sec.color}`}>
                      <Icon className="h-4 w-4" aria-hidden="true" />
                    </div>
                    <h2 className="text-xl md:text-2xl font-bold text-foreground tracking-tight">
                      {t(sec.titleKey)}
                    </h2>
                  </div>

                  {/* Contenido textual */}
                  <div className="pl-11 md:pl-14 space-y-4">
                    <p className="text-sm md:text-base text-foreground/80 leading-relaxed">
                      {t(sec.textKey)}
                    </p>

                    {/* Contenido enriquecido para sección ARCO (04) */}
                    {sec.id === "arco" && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                        <div className="rounded-2xl border border-border/70 bg-muted/30 p-4 space-y-1">
                          <div className="flex items-center gap-2 text-xs font-bold text-foreground">
                            <CheckCircle2 className="h-4 w-4 text-secondary shrink-0" />
                            <span>Acceso y Rectificación</span>
                          </div>
                          <p className="text-xs text-muted-foreground leading-relaxed">
                            Conocer los datos personales almacenados y solicitar su corrección si están desactualizados o inexactos.
                          </p>
                        </div>
                        <div className="rounded-2xl border border-border/70 bg-muted/30 p-4 space-y-1">
                          <div className="flex items-center gap-2 text-xs font-bold text-foreground">
                            <CheckCircle2 className="h-4 w-4 text-secondary shrink-0" />
                            <span>Cancelación y Oposición</span>
                          </div>
                          <p className="text-xs text-muted-foreground leading-relaxed">
                            Solicitar la supresión o negarse a tratamientos específicos según las facultades que confiere la ley.
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Contenido enriquecido para sección de contacto (06) */}
                    {sec.id === "contact" && (
                      <div className="pt-2 flex flex-wrap items-center gap-3">
                        <a
                          href="mailto:fcm@ucn.cl"
                          className="inline-flex items-center gap-2 rounded-xl border border-primary/30 bg-primary/10 hover:bg-primary/20 text-primary px-4 py-2 text-xs font-bold transition-all shadow-xs"
                        >
                          <Mail className="h-4 w-4" />
                          <span>fcm@ucn.cl</span>
                          <ExternalLink className="h-3 w-3 opacity-70" />
                        </a>
                        <span className="inline-flex items-center gap-2 rounded-xl border border-border bg-muted/40 text-muted-foreground px-4 py-2 text-xs font-medium">
                          <Building2 className="h-4 w-4 text-secondary" />
                          <span>Campus Guayacán, Coquimbo · Chile</span>
                        </span>
                      </div>
                    )}
                  </div>

                  {index < sections.length - 1 && (
                    <div className="pt-6 border-b border-border/60"></div>
                  )}
                </section>
              );
            })}
          </div>

          {/* Cierre del documento con botón CTA de regreso y pie institucional */}
          <div className="border-t border-border/80 pt-10 flex flex-col sm:flex-row items-center justify-between gap-6">
            <Link
              href="/"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 rounded-2xl bg-ocean-cyan hover:bg-ocean-cyan/90 text-white px-6 py-3.5 text-sm font-black shadow-md hover:shadow-lg hover:shadow-ocean-cyan/25 active:scale-95 transition-all group"
            >
              <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
              <span>{t("back_to_login")}</span>
            </Link>

            <div className="text-center sm:text-right space-y-1">
              <p className="text-xs font-semibold text-foreground">
                MARSYS · Gestión Académica FCM
              </p>
              <p className="text-2xs text-muted-foreground">
                © 2026 Facultad de Ciencias del Mar · Universidad Católica del Norte
              </p>
            </div>
          </div>
        </article>
      </main>
    </div>
  );
}
