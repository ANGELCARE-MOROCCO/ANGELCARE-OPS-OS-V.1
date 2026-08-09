
export const BRAND_GOVERNANCE_MODES = [
  { key: 'command', label: 'Brand Command', signal: 'Conformité & couverture' },
  { key: 'official', label: 'Identité AngelCare', signal: 'Registre officiel' },
  { key: 'customers', label: 'Marques clients', signal: 'Profils & modes' },
  { key: 'assets', label: 'Assets Windows', signal: 'Stockage & limites' },
  { key: 'publication', label: 'Publication', signal: 'Review, approval & release' },
  { key: 'runtime', label: 'Runtime & audit', signal: 'Résolution & fallback' },
] as const
export type BrandGovernanceMode = (typeof BRAND_GOVERNANCE_MODES)[number]['key']
export function normalizeBrandGovernanceMode(value: string | null | undefined): BrandGovernanceMode {
  return BRAND_GOVERNANCE_MODES.some((item) => item.key === value) ? value as BrandGovernanceMode : 'command'
}
export function brandGovernanceHref(mode: BrandGovernanceMode) { return `/angelcare-360-operator/brand-governance?view=${mode}` }
