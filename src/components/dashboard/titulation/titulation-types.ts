export type TitulationStage =
  | "UNCLASSIFIED"
  | "INTAKE"
  | "REVIEW"
  | "DEFENSE"
  | "CLOSED";

export type TitulationDocumentStatus =
  | "UNVERIFIED"
  | "PENDING"
  | "RECEIVED"
  | "PREPARED";

export type TitulationDataSource = "MANUAL" | "LEGACY_ACCESS";
export type TitulationDocumentDraftKind =
  | "defense-annexes"
  | "thesis-summary"
  | "library-authorization";

export interface TitulationProcess {
  id: string;
  reference: string;
  studentName: string;
  studentRut: string | null;
  studentEmail: string | null;
  studentPhone: string | null;
  thesisTopic: string | null;
  degree: string | null;
  careerName: string;
  careerId: string | null;
  guideName: string | null;
  coGuideName: string | null;
  reviewerOneName: string | null;
  reviewerTwoName: string | null;
  defenseDate: string | null;
  stage: TitulationStage;
  source: TitulationDataSource;
  documentDrafts: TitulationDocumentDraftKind[];
  defenseAnnexesStatus: TitulationDocumentStatus;
  thesisSummaryStatus: TitulationDocumentStatus;
  libraryFormStatus: TitulationDocumentStatus;
  actaStatus: TitulationDocumentStatus;
  evaluationsStatus: TitulationDocumentStatus;
  createdAt: string;
  updatedAt: string;
}

export interface TitulationPageResult {
  items: TitulationListItem[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface TitulationListItem {
  id: string;
  reference: string;
  studentName: string;
  thesisTopic: string | null;
  degree: string | null;
  careerName: string;
  defenseDate: string | null;
  stage: TitulationStage;
  source: TitulationDataSource;
  defenseAnnexesStatus: TitulationDocumentStatus;
  thesisSummaryStatus: TitulationDocumentStatus;
  libraryFormStatus: TitulationDocumentStatus;
  actaStatus: TitulationDocumentStatus;
  evaluationsStatus: TitulationDocumentStatus;
  updatedAt: string;
}

export interface TitulationFormValues {
  studentName: string;
  studentRut: string;
  studentEmail: string;
  studentPhone: string;
  thesisTopic: string;
  degree: string;
  careerId: string;
  guideName: string;
  coGuideName: string;
  reviewerOneName: string;
  reviewerTwoName: string;
  defenseDate: string;
  stage: TitulationStage;
  defenseAnnexesStatus: TitulationDocumentStatus;
  thesisSummaryStatus: TitulationDocumentStatus;
  libraryFormStatus: TitulationDocumentStatus;
  actaStatus: TitulationDocumentStatus;
  evaluationsStatus: TitulationDocumentStatus;
}
