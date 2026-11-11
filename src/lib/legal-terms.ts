import { apiFetch } from '@/lib/api';

export type TermsDocument = {
  version: string;
  locale: 'es' | 'en';
  title: string;
  notice: string;
  contentHash: string;
  sections: { heading: string; paragraphs: string[] }[];
};

export type TermsStatus = {
  currentVersion: string;
  accepted: boolean;
  acceptedAt: string | null;
};

export type TermsAcceptance = {
  version: string;
  locale: 'es' | 'en';
  contentHash: string;
  acceptedAt: string;
  contentSnapshot: Pick<TermsDocument, 'title' | 'notice' | 'sections'>;
};

export const getCurrentTerms = (locale: string) =>
  apiFetch<TermsDocument>(`/legal/terms/current?locale=${locale}`, { cache: 'no-store' });

export const getTermsStatus = () =>
  apiFetch<TermsStatus>('/legal/terms/status', { cache: 'no-store' });

export const acceptCurrentTerms = (version: string, locale: string) =>
  apiFetch<TermsAcceptance>('/legal/terms/accept', {
    method: 'POST',
    body: JSON.stringify({ version, locale }),
  });

export const getTermsAcceptanceHistory = () =>
  apiFetch<TermsAcceptance[]>('/legal/terms/acceptances', { cache: 'no-store' });
