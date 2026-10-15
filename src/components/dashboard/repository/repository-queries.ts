import { gql, type TypedDocumentNode } from '@apollo/client';
import type { RepositoryRecord } from '@/types/academic-repository';
import type { PaginatedResponse } from '@/types/pagination';
import type { ResearchOutputKind, ResearchOutputRecord } from '@/types/research-output';

export type RepositoryListRecordData = Omit<RepositoryRecord, '_count'> & {
  outputCount: number;
};

export interface RepositoryFilters {
  page: number;
  pageSize: number;
  search: string;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
  status?: string;
  reportingYear?: number;
}

export interface RepositoryProjectsData {
  repositoryProjects: PaginatedResponse<RepositoryListRecordData>;
}

export interface RepositoryResearchData {
  repositoryResearch: PaginatedResponse<RepositoryListRecordData>;
}

export interface ResearchOutputFilters {
  page: number;
  pageSize: number;
  search: string;
  researchId?: string;
  kind?: ResearchOutputKind;
  reportingYear?: number;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
}

export interface ResearchOutputsData {
  repositoryResearchOutputs: PaginatedResponse<ResearchOutputRecord>;
}

const fields = gql`
  fragment RepositoryListFields on RepositoryListRecord {
    id title academicUnit code startsOn endsOn updatedAt createdAt
    reportingYear status outputCount
    participants { id name role teacherId contactEmail gender }
  }
`;

export const REPOSITORY_PROJECTS: TypedDocumentNode<RepositoryProjectsData, { filters: RepositoryFilters }> = gql`
  query RepositoryProjects($filters: RepositoryListFilters!) {
    repositoryProjects(filters: $filters) {
      items { ...RepositoryListFields }
      total page pageSize totalPages
    }
  }
  ${fields}
`;

export const REPOSITORY_RESEARCH: TypedDocumentNode<RepositoryResearchData, { filters: RepositoryFilters }> = gql`
  query RepositoryResearch($filters: RepositoryListFilters!) {
    repositoryResearch(filters: $filters) {
      items { ...RepositoryListFields }
      total page pageSize totalPages
    }
  }
  ${fields}
`;

export const RESEARCH_OUTPUTS: TypedDocumentNode<ResearchOutputsData, { filters: ResearchOutputFilters }> = gql`
  query RepositoryResearchOutputs($filters: ResearchOutputListFilters!) {
    repositoryResearchOutputs(filters: $filters) {
      items {
        id researchId kind reportingYear title doi journal issn isbn quartile
        fiveYearImpactFactor publicationDate indexation publisher publicationPlace
        studentParticipation internationalParticipation intellectualPropertyType
        phase phaseDate notes updatedAt createdAt
        research { id title code }
        authors { id name position affiliation isStudent teacherId studentId }
        projects { project { id title code } }
      }
      total page pageSize totalPages
    }
  }
`;
