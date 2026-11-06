import type { CmsPage } from '../experience-builder/types';

export type LegalKind = 'terms' | 'privacy';
export type LegalLocale = 'fr' | 'en' | 'ar';
export const LEGAL_ROUTE_REVISION = 'AC-LEGAL-R1';
export const LEGAL_IDENTITIES: Record<LegalKind, { slugs: readonly string[]; keys: readonly string[] }> = {
  terms: {
    slugs: ['legal/terms', 'terms', 'terms-and-conditions', 'terms-of-service', 'conditions-utilisation', 'conditions-generales-utilisation', 'conditions-generales-d-utilisation', 'cgu'],
    keys: ['public.legal.terms', 'legal.terms', 'public.terms', 'public.terms-of-service'],
  },
  privacy: {
    slugs: ['legal/privacy', 'privacy', 'privacy-policy', 'politique-de-confidentialite', 'politique-confidentialite', 'confidentialite'],
    keys: ['public.legal.privacy', 'legal.privacy', 'public.privacy', 'public.privacy-policy'],
  },
};
export type LegalRow = Record<string, unknown>;
export const text = (value: unknown) => typeof value === 'string' ? value.trim() : '';
export function legalIdentity(kind: LegalKind, row: LegalRow): boolean {
  const identity = LEGAL_IDENTITIES[kind];
  return identity.keys.includes(text(row.route_key)) || identity.slugs.includes(text(row.published_slug) || text(row.slug));
}
export function publishedLegalRow(row: LegalRow): boolean {
  const state = text(row.publication_state);
  // A modern explicit draft/unpublished state is never overridden by legacy status.
  return state ? state === 'published' : row.status === 'published';
}
export type CandidateSelection = { status: 'missing' } | { status: 'ambiguous' } | { status: 'candidate'; page: CmsPage };
export function selectLegalCandidate(kind: LegalKind, locale: LegalLocale, territoryId: string | null, input: readonly LegalRow[]): CandidateSelection {
  const byId = new Map<string, LegalRow>();
  for (const row of input) {
    if (!text(row.id) || !legalIdentity(kind, row) || !publishedLegalRow(row)) continue;
    const publishedLocale = text(row.published_locale) || text(row.locale);
    const territory = row.published_territory_id !== undefined ? text(row.published_territory_id) : text(row.territory_id);
    if (publishedLocale !== locale || (territory && territory !== territoryId)) continue;
    byId.set(text(row.id), row);
  }
  const rank = (row: LegalRow) => {
    const territory = row.published_territory_id !== undefined ? text(row.published_territory_id) : text(row.territory_id);
    const slug = text(row.published_slug) || text(row.slug);
    return (territoryId && territory === territoryId ? 100 : 0) + (slug === `legal/${kind}` ? 20 : LEGAL_IDENTITIES[kind].keys.includes(text(row.route_key)) ? 10 : 0);
  };
  const candidates = [...byId.values()].sort((a, b) => rank(b) - rank(a) || text(a.id).localeCompare(text(b.id)));
  if (!candidates.length) return { status: 'missing' };
  if (candidates[1] && rank(candidates[0]) === rank(candidates[1])) return { status: 'ambiguous' };
  return { status: 'candidate', page: candidates[0] as unknown as CmsPage };
}
export const legalPath = (locale: LegalLocale, kind: LegalKind) => `/angelcare-marketplace/${locale}/legal/${kind}`;
