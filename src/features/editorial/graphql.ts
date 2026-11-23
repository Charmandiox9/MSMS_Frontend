import { gql, type TypedDocumentNode } from "@apollo/client";
import type {
  EditorialDraftInput,
  EditorialFilters,
  EditorialKind,
  EditorialManagedEntry,
  EditorialManagedPage,
  EditorialPage,
  EditorialPublication,
  EditorialRoleOption,
  EditorialVersionInput,
} from "./schema-types";

const revision = gql`
  fragment EditorialRevisionFields on EditorialRevisionView {
    number
    topic
    titleEs
    summaryEs
    bodyEs
    titleEn
    summaryEn
    bodyEn
    destination
    guideId
    roleCodes
    files {
      id
      kind
      language
      status
      fileName
      size
      duration
      videoId
    }
  }
`;
const reader = gql`
  fragment EditorialPublicationFields on EditorialPublication {
    id
    kind
    featured
    firstPublishedAt
    publishedAt
    published {
      ...EditorialRevisionFields
    }
  }
  ${revision}
`;
const manager = gql`
  fragment EditorialManagedFields on EditorialManagedEntry {
    id
    kind
    featured
    firstPublishedAt
    publishedAt
    status
    version
    updatedAt
    published {
      ...EditorialRevisionFields
    }
    draft {
      ...EditorialRevisionFields
    }
  }
  ${revision}
`;

export const PUBLICATIONS: TypedDocumentNode<
  { editorialPublications: EditorialPage },
  { filters: EditorialFilters }
> = gql`
  query EditorialPublications($filters: EditorialFilters!) {
    editorialPublications(filters: $filters) {
      total
      items {
        ...EditorialPublicationFields
      }
    }
  }
  ${reader}
`;
export const FEATURED: TypedDocumentNode<{
  editorialFeaturedPublication: EditorialPublication | null;
}> = gql`
  query EditorialFeatured {
    editorialFeaturedPublication {
      ...EditorialPublicationFields
    }
  }
  ${reader}
`;
export const PUBLICATION: TypedDocumentNode<
  { editorialPublication: EditorialPublication },
  { id: string }
> = gql`
  query EditorialPublication($id: ID!) {
    editorialPublication(id: $id) {
      ...EditorialPublicationFields
    }
  }
  ${reader}
`;
export const MANAGED: TypedDocumentNode<
  { editorialManagedEntries: EditorialManagedPage },
  { filters: EditorialFilters }
> = gql`
  query EditorialManaged($filters: EditorialFilters!) {
    editorialManagedEntries(filters: $filters) {
      total
      items {
        ...EditorialManagedFields
      }
    }
  }
  ${manager}
`;
export const EDITORIAL_ROLES: TypedDocumentNode<{
  editorialRoleOptions: EditorialRoleOption[];
}> = gql`
  query EditorialRoles {
    editorialRoleOptions {
      code
      name
    }
  }
`;
export const ENTRY: TypedDocumentNode<
  { editorialManagedEntry: EditorialManagedEntry },
  { id: string }
> = gql`
  query EditorialEntry($id: ID!) {
    editorialManagedEntry(id: $id) {
      ...EditorialManagedFields
    }
  }
  ${manager}
`;
export const CREATE: TypedDocumentNode<
  { createEditorialEntry: EditorialManagedEntry },
  { kind: EditorialKind }
> = gql`
  mutation CreateEditorial($kind: EditorialKind!) {
    createEditorialEntry(kind: $kind) {
      ...EditorialManagedFields
    }
  }
  ${manager}
`;
export const SAVE: TypedDocumentNode<
  { saveEditorialDraft: EditorialManagedEntry },
  { input: EditorialDraftInput }
> = gql`
  mutation SaveEditorial($input: EditorialDraftInput!) {
    saveEditorialDraft(input: $input) {
      ...EditorialManagedFields
    }
  }
  ${manager}
`;
export const PUBLISH: TypedDocumentNode<
  { publishEditorialEntry: EditorialManagedEntry },
  { input: EditorialVersionInput }
> = gql`
  mutation PublishEditorial($input: EditorialVersionInput!) {
    publishEditorialEntry(input: $input) {
      ...EditorialManagedFields
    }
  }
  ${manager}
`;
export const ARCHIVE: TypedDocumentNode<
  { archiveEditorialEntry: EditorialManagedEntry },
  { input: EditorialVersionInput }
> = gql`
  mutation ArchiveEditorial($input: EditorialVersionInput!) {
    archiveEditorialEntry(input: $input) {
      ...EditorialManagedFields
    }
  }
  ${manager}
`;
export const HIGHLIGHT: TypedDocumentNode<
  { setEditorialFeatured: EditorialManagedEntry },
  { input: EditorialVersionInput; featured: boolean }
> = gql`
  mutation HighlightEditorial(
    $input: EditorialVersionInput!
    $featured: Boolean!
  ) {
    setEditorialFeatured(input: $input, featured: $featured) {
      ...EditorialManagedFields
    }
  }
  ${manager}
`;
