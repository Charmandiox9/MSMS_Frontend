export type ResearchOutputKind = "ARTICLE" | "BOOK" | "BOOK_CHAPTER" | "INTELLECTUAL_PROPERTY";

export interface ResearchOutputAuthor {
  id: string;
  name: string;
  position: number;
  affiliation: string | null;
  isStudent: boolean | null;
  teacherId: string | null;
  studentId: string | null;
}

export interface ResearchOutputRecord {
  id: string;
  researchId: string | null;
  kind: ResearchOutputKind;
  reportingYear: number;
  title: string;
  doi: string | null;
  journal: string | null;
  issn: string | null;
  isbn: string | null;
  quartile: string | null;
  fiveYearImpactFactor: string | null;
  publicationDate: string | null;
  indexation: string | null;
  publisher: string | null;
  publicationPlace: string | null;
  studentParticipation: boolean | null;
  internationalParticipation: boolean | null;
  intellectualPropertyType: string | null;
  phase: string | null;
  phaseDate: string | null;
  notes: string | null;
  updatedAt: string;
  createdAt: string;
  research: { id: string; title: string; code: string | null } | null;
  authors: ResearchOutputAuthor[];
  projects: { project: { id: string; title: string; code: string | null } }[];
}

export interface ResearchOption {
  id: string;
  title: string;
  code: string | null;
}
