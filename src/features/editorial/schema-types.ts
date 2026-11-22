// Generated from the backend GraphQL schema. Run pnpm run generate:editorial-types.

export interface EditorialFileView {
  id: string;
  kind: EditorialFileKind;
  language: EditorialLanguage;
  status: EditorialFileStatus;
  fileName: string;
  size: number | null;
  duration: number | null;
  videoId: string | null;
}

export type EditorialFileKind = "PDF" | "VIDEO" | "CAPTIONS";

export type EditorialLanguage = "ES" | "EN";

export type EditorialFileStatus = "PENDING" | "UPLOADING" | "READY" | "DELETING";

export interface EditorialRevisionView {
  number: number;
  topic: EditorialTopic | null;
  titleEs: string;
  summaryEs: string;
  bodyEs: string;
  titleEn: string | null;
  summaryEn: string | null;
  bodyEn: string | null;
  destination: EditorialDestination | null;
  guideId: string | null;
  files: Array<EditorialFileView>;
}

export type EditorialTopic = "PLATFORM" | "JUSTIFICATIONS" | "DEPARTMENTS_CAREERS" | "SUBJECTS" | "TEACHERS" | "STUDENTS" | "PROJECTS" | "RESEARCH" | "ASSISTANTSHIPS" | "TITULATION" | "REPORTS_CHARTS" | "ADMINISTRATION";

export type EditorialDestination = "DASHBOARD" | "JUSTIFICATIONS" | "CAREERS" | "SUBJECTS" | "TEACHERS" | "STUDENTS" | "PROJECTS" | "RESEARCH" | "RESEARCH_OUTPUTS" | "ASSISTANTSHIPS" | "TITULATION" | "REPORTS" | "CHARTS" | "SETTINGS";

export interface EditorialPublication {
  id: string;
  kind: EditorialKind;
  featured: boolean;
  firstPublishedAt: string | null;
  publishedAt: string | null;
  published: EditorialRevisionView | null;
}

export type EditorialKind = "NEWS" | "GUIDE";

export interface EditorialManagedEntry {
  id: string;
  kind: EditorialKind;
  featured: boolean;
  firstPublishedAt: string | null;
  publishedAt: string | null;
  published: EditorialRevisionView | null;
  status: EditorialStatus;
  version: number;
  updatedAt: string;
  draft: EditorialRevisionView | null;
}

export type EditorialStatus = "DRAFT" | "PUBLISHED" | "ARCHIVED";

export interface EditorialPage {
  items: Array<EditorialPublication>;
  total: number;
}

export interface EditorialManagedPage {
  items: Array<EditorialManagedEntry>;
  total: number;
}

export interface EditorialFilters {
  kind?: EditorialKind | null;
  topic?: EditorialTopic | null;
  format?: EditorialFormat | null;
  search?: string | null;
  page?: number;
  pageSize?: number;
}

export type EditorialFormat = "TEXT" | "PDF" | "VIDEO";

export interface EditorialDraftInput {
  id: string;
  version: number;
  topic?: EditorialTopic | null;
  titleEs: string;
  summaryEs: string;
  bodyEs: string;
  titleEn?: string | null;
  summaryEn?: string | null;
  bodyEn?: string | null;
  destination?: EditorialDestination | null;
  guideId?: string | null;
  fileIds: Array<string>;
}

export interface EditorialVersionInput {
  id: string;
  version: number;
}
