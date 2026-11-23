import type {
  EditorialDestination,
  EditorialFileKind,
  EditorialFormat,
  EditorialTopic,
  EditorialRevisionView,
} from "./schema-types";

export const editorialTopics: EditorialTopic[] = [
  "PLATFORM",
  "JUSTIFICATIONS",
  "DEPARTMENTS_CAREERS",
  "SUBJECTS",
  "TEACHERS",
  "STUDENTS",
  "PROJECTS",
  "RESEARCH",
  "ASSISTANTSHIPS",
  "TITULATION",
  "REPORTS_CHARTS",
  "ADMINISTRATION",
];

export const editorialFormats: EditorialFormat[] = ["TEXT", "PDF", "VIDEO"];

export const editorialDestinations: Record<EditorialDestination, string> = {
  DASHBOARD: "/dashboard",
  JUSTIFICATIONS: "/dashboard/justifications",
  CAREERS: "/dashboard/careers",
  SUBJECTS: "/dashboard/subjects",
  TEACHERS: "/dashboard/teachers",
  STUDENTS: "/dashboard/students",
  PROJECTS: "/dashboard/projects",
  RESEARCH: "/dashboard/research",
  RESEARCH_OUTPUTS: "/dashboard/research-outputs",
  ASSISTANTSHIPS: "/dashboard/assistantships",
  TITULATION: "/dashboard/titulation",
  REPORTS: "/dashboard/reports",
  CHARTS: "/dashboard/charts",
  SETTINGS: "/dashboard/settings",
};

export const fileTypes: Record<
  EditorialFileKind,
  { accept: string; maxBytes: number }
> = {
  PDF: { accept: ".pdf,application/pdf", maxBytes: 10 * 1024 * 1024 },
  VIDEO: { accept: ".mp4,video/mp4", maxBytes: 50 * 1024 * 1024 },
  CAPTIONS: { accept: ".vtt,text/vtt", maxBytes: 256 * 1024 },
};

export const fieldClass =
  "w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus";
export const buttonClass =
  "inline-flex min-h-10 items-center justify-center gap-2 rounded-lg border border-border bg-card px-3 py-2 text-sm font-semibold text-foreground hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus disabled:opacity-50";
export const primaryClass = `${buttonClass} border-primary bg-primary text-primary-foreground hover:bg-primary/90`;
export const linkClass =
  "font-semibold text-primary underline decoration-primary/40 underline-offset-4 hover:decoration-current focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus";

export function editorialText(revision: EditorialRevisionView, locale: string) {
  if (
    locale === "en" &&
    revision.titleEn &&
    revision.summaryEn &&
    (!revision.bodyEs || revision.bodyEn)
  ) {
    return {
      title: revision.titleEn,
      summary: revision.summaryEn,
      body: revision.bodyEn ?? "",
      lang: "en",
    };
  }
  return {
    title: revision.titleEs,
    summary: revision.summaryEs,
    body: revision.bodyEs,
    lang: "es",
  };
}

export function publicationHref(kind: "NEWS" | "GUIDE", id: string) {
  return `/dashboard/updates/${kind === "NEWS" ? "news" : "guides"}/${id}`;
}

export function roleHeaders(role?: string | null): Record<string, string> {
  return role ? { "X-Marsys-Active-Role": role } : {};
}

export function matchesEditorialAudience(
  roleCodes: string[],
  role?: string | null,
) {
  return roleCodes.length === 0 || (!!role && roleCodes.includes(role));
}
