export type RepositoryKind = "projects" | "research";
export const PROJECT_STATUSES = [
  "REGISTERED",
  "AWARDED",
  "IN_PROGRESS",
  "COMPLETED",
  "CLOSED",
  "CANCELLED",
] as const;
export type ProjectStatus = (typeof PROJECT_STATUSES)[number];
export interface RepositoryParticipant {
  id?: string;
  name: string;
  role: string;
  teacherId: string | null;
  contactEmail?: string | null;
  gender?: string | null;
}
export interface RepositoryRecord {
  id: string;
  title: string;
  academicUnit: string;
  code: string | null;
  startsOn: string | null;
  endsOn: string | null;
  updatedAt: string;
  createdAt: string;
  participants: RepositoryParticipant[];
  _count: { outputs: number };
  reportingYear?: number;
  status?: ProjectStatus;
  faculty?: string | null;
  resolution?: string | null;
  classification?: string | null;
  fundingSource?: string | null;
  program?: string | null;
  competition?: string | null;
  applicationArea?: string | null;
  participationScope?: string | null;
  officialized?: boolean | null;
  revisedEndsOn?: string | null;
  closedOn?: string | null;
  currency?: string | null;
  totalAmount?: string | null;
  vraContribution?: string | null;
  vridtContribution?: string | null;
  recoveryAmount?: string | null;
  facultyContribution?: string | null;
  depreciationAmount?: string | null;
  profitabilityAmount?: string | null;
  folderUrl?: string | null;
  notes?: string | null;
  description?: string | null;
  researchArea?: string | null;
  projectId?: string | null;
  project?: { id: string; title: string; code: string | null } | null;
  research?: { id: string; title: string } | null;
}
export type RepositoryFieldKey = Exclude<
  keyof RepositoryRecord,
  | "id"
  | "updatedAt"
  | "createdAt"
  | "participants"
  | "_count"
  | "project"
  | "research"
  | "projectId"
>;
export type RepositoryFormValues = Partial<Record<RepositoryFieldKey, string>>;
export interface RepositoryField {
  key: RepositoryFieldKey;
  type?:
    | "text"
    | "date"
    | "number"
    | "money"
    | "textarea"
    | "url"
    | "status"
    | "boolean";
  required?: boolean;
  maxLength?: number;
}
export interface RepositoryFieldGroup {
  key: string;
  fields: RepositoryField[];
}
