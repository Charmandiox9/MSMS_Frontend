import { gql, type TypedDocumentNode } from '@apollo/client';

export interface ReportTable {
  columns: string[];
  rows: { values: (string | number | null)[] }[];
  totalRows: number;
  page?: number | null;
  pageSize?: number | null;
}
export interface ReportFilters {
  dataset: string;
  semesterId?: string;
  search?: string;
  reportingYear?: number;
  page?: number;
  pageSize?: number;
}
export interface ChartFilters {
  reportingYear?: number;
  semesterId?: string;
  startsOn?: string;
  endsOn?: string;
}
export interface ChartSummary {
  projects: ReportTable;
  researchByYear: { label: string; value: string }[];
  outputs: { kind: string; reportingYear: number; count: number }[];
  hourlyByComponent: { label: string; value: string; count: number }[];
  semesters: { id: string; name: string }[];
}

export function unpackReport(table: ReportTable): Omit<ReportTable, 'rows'> & { rows: Record<string, string | number | null>[] } {
  return { ...table, rows: table.rows.map(({ values }) => Object.fromEntries(table.columns.map((column, index) => [column, values[index] ?? null]))) };
}

export const ACADEMIC_REPORT: TypedDocumentNode<{ academicReport: ReportTable }, { filters: ReportFilters }> = gql`
  query AcademicReport($filters: AcademicReportQuery!) {
    academicReport(filters: $filters) { columns rows { values } totalRows page pageSize }
  }
`;
export const REPORT_SEMESTERS: TypedDocumentNode<{ academicReportSemesters: { id: string; name: string }[] }> = gql`
  query AcademicReportSemesters { academicReportSemesters { id name } }
`;
export const ACADEMIC_CHARTS: TypedDocumentNode<{ academicCharts: ChartSummary }, { filters: ChartFilters }> = gql`
  query AcademicCharts($filters: AcademicChartFilters!) {
    academicCharts(filters: $filters) {
      projects { columns rows { values } totalRows }
      researchByYear { label value }
      outputs { kind reportingYear count }
      hourlyByComponent { label value count }
      semesters { id name }
    }
  }
`;
