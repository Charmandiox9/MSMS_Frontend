export const applicationEndpoint = "/academic/assistantship-applications";

export const applicationStatuses = ["PENDING", "APPROVED", "REJECTED"] as const;
export type ApplicationStatus = (typeof applicationStatuses)[number];

export type ApplicationItem = {
  id: string;
  name: string;
  subject: string;
  submittedAt: string;
  status: ApplicationStatus;
  studentId: string | null;
  assistantshipId: string | null;
};

export type ApplicationDetail = ApplicationItem & {
  studentEmail: string;
  rut: string;
  phone: string;
  submittedCareer: string;
  address: string;
  motivation: string;
  ppa: string;
  reviewedAt: string | null;
  reviewNote: string | null;
  notification: "NOT_REQUESTED" | "PENDING" | "SENT" | "FAILED";
  student: {
    id: string;
    name: string;
    email: string | null;
    career: { id: string; name: string } | null;
  } | null;
};

export type ApplicationPage = { items: ApplicationItem[]; hasMore: boolean };
