export type AcademicDegree =
  "PROFESSIONAL" | "MASTER" | "DOCTOR" | "NOT_APPLICABLE";
export type TeacherCertification = "NONE" | "LEVEL_1" | "LEVEL_2" | "LEVEL_3";
export type HourlyTeacherCategory =
  "NEW" | "EXISTING" | "DIVING_PRINCIPAL" | "DIVING_SECONDARY";
export type TeachingComponent =
  "LECTURE" | "WORKSHOP" | "LABORATORY" | "FIELDWORK" | "ASSISTANTSHIP";

export interface HourlyPayRate {
  id: string;
  semesterId: string;
  category: HourlyTeacherCategory;
  academicDegree: AcademicDegree;
  certification: TeacherCertification;
  hourlyRateClp: string;
}
export interface HourlyRateCatalog {
  semester: {
    id: string;
    name: string;
    startsOn: string;
    endsOn: string;
  } | null;
  rates: HourlyPayRate[];
}
export interface HourlyContractInput {
  id?: string;
  nrc: string;
  payRateId: string;
  component: TeachingComponent;
  parallel: string;
  directHours: number;
  startsOn: string;
  endsOn: string;
}
export interface HourlyPaymentCalculation {
  monthlyAmountClp: string;
  months: { month: string; days: number; amountClp: string }[];
  totalAmountClp: string;
}
export interface HourlyPaymentPreview {
  lines: (HourlyContractInput & { calculation: HourlyPaymentCalculation })[];
  totalAmountClp: string;
}
export interface TeacherHourlyContracts {
  semesterId: string | null;
  contracts: (HourlyContractInput & {
    calculation: HourlyPaymentCalculation;
  })[];
}

export const academicDegrees: AcademicDegree[] = [
  "PROFESSIONAL",
  "MASTER",
  "DOCTOR",
  "NOT_APPLICABLE",
];
export const teacherCertifications: TeacherCertification[] = [
  "NONE",
  "LEVEL_1",
  "LEVEL_2",
  "LEVEL_3",
];
export const hourlyTeacherCategories: HourlyTeacherCategory[] = [
  "NEW",
  "EXISTING",
  "DIVING_PRINCIPAL",
  "DIVING_SECONDARY",
];
export const teachingComponents: TeachingComponent[] = [
  "LECTURE",
  "WORKSHOP",
  "LABORATORY",
  "FIELDWORK",
  "ASSISTANTSHIP",
];
