import { MarketplaceError } from '../server/errors'
import { cleanOptionalText, cleanText, requireText } from '../server/request'
import type {
  TerritoryGateRequirement,
  TerritoryGateStatus,
  TerritoryHealthStatus,
  TerritoryOverrideStatus,
  TerritoryStatus,
  TerritoryType,
} from './types'

const territoryStatuses = new Set<TerritoryStatus>(['draft', 'configuring', 'review', 'soft_launch', 'live', 'paused', 'archived'])
const healthStatuses = new Set<TerritoryHealthStatus>(['healthy', 'attention_required', 'at_risk', 'critical', 'paused', 'unknown'])
const territoryTypes = new Set<TerritoryType>(['country', 'region', 'city_cluster', 'vertical_world'])
const overrideStatuses = new Set<TerritoryOverrideStatus>(['draft', 'submitted', 'in_review', 'approved', 'rejected', 'effective', 'rolled_back', 'archived'])
const gateStatuses = new Set<TerritoryGateStatus>(['not_started', 'in_progress', 'submitted', 'passed', 'failed', 'waiver_requested', 'waiver_approved', 'expired', 'not_applicable'])
const gateRequirements = new Set<TerritoryGateRequirement>(['mandatory_blocking', 'mandatory_non_blocking', 'recommended', 'informational'])

export function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : {}
}

export function asStringArray(value: unknown, maxItems = 50): string[] {
  if (!Array.isArray(value)) return []
  return [...new Set(value.map((item) => cleanText(item, 160)).filter(Boolean))].slice(0, maxItems)
}

export function asLocaleArray(value: unknown): Array<'fr' | 'en' | 'ar'> {
  const allowed = new Set(['fr', 'en', 'ar'])
  return asStringArray(value, 3).filter((item): item is 'fr' | 'en' | 'ar' => allowed.has(item))
}

export function asLocale(value: unknown, fallback: 'fr' | 'en' | 'ar' = 'fr'): 'fr' | 'en' | 'ar' {
  return value === 'en' || value === 'ar' || value === 'fr' ? value : fallback
}

export function asTerritoryStatus(value: unknown): TerritoryStatus {
  const normalized = cleanText(value, 40) as TerritoryStatus
  if (!territoryStatuses.has(normalized)) throw new MarketplaceError('VALIDATION_ERROR', 'Le statut territoire est invalide.')
  return normalized
}

export function asTerritoryHealth(value: unknown): TerritoryHealthStatus {
  const normalized = cleanText(value, 40) as TerritoryHealthStatus
  if (!healthStatuses.has(normalized)) throw new MarketplaceError('VALIDATION_ERROR', 'Le niveau de santé territoire est invalide.')
  return normalized
}

export function asTerritoryType(value: unknown): TerritoryType {
  const normalized = cleanText(value || 'country', 40) as TerritoryType
  if (!territoryTypes.has(normalized)) throw new MarketplaceError('VALIDATION_ERROR', 'Le type de territoire est invalide.')
  return normalized
}

export function asOverrideStatus(value: unknown): TerritoryOverrideStatus {
  const normalized = cleanText(value, 40) as TerritoryOverrideStatus
  if (!overrideStatuses.has(normalized)) throw new MarketplaceError('VALIDATION_ERROR', 'Le statut de dérogation est invalide.')
  return normalized
}

export function asGateStatus(value: unknown): TerritoryGateStatus {
  const normalized = cleanText(value, 40) as TerritoryGateStatus
  if (!gateStatuses.has(normalized)) throw new MarketplaceError('VALIDATION_ERROR', 'Le statut de gate est invalide.')
  return normalized
}

export function asGateRequirement(value: unknown): TerritoryGateRequirement {
  const normalized = cleanText(value, 60) as TerritoryGateRequirement
  if (!gateRequirements.has(normalized)) throw new MarketplaceError('VALIDATION_ERROR', 'Le niveau d’exigence est invalide.')
  return normalized
}

export function requireTerritoryCode(value: unknown): string {
  const normalized = requireText(value, 'territoryCode', 'Le code territoire', 32)
    .toUpperCase()
    .replace(/[^A-Z0-9-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
  if (!/^[A-Z0-9][A-Z0-9-]{1,30}[A-Z0-9]$/.test(normalized)) {
    throw new MarketplaceError('VALIDATION_ERROR', 'Le code territoire doit contenir 3 à 32 caractères A-Z, 0-9 ou tiret.', {
      fieldErrors: { territoryCode: ['Format attendu : MA-MASTER, FR-PARIS ou HOTEL-MENA.'] },
    })
  }
  return normalized
}

export function requireCountryCode(value: unknown): string {
  const normalized = requireText(value, 'countryCode', 'Le code pays', 2).toUpperCase()
  if (!/^[A-Z]{2}$/.test(normalized)) {
    throw new MarketplaceError('VALIDATION_ERROR', 'Le code pays ISO à deux lettres est requis.', {
      fieldErrors: { countryCode: ['Exemple : MA, FR, AE.'] },
    })
  }
  return normalized
}

export function requireTimezone(value: unknown): string {
  const timezone = requireText(value, 'timezone', 'Le fuseau horaire', 80)
  try {
    new Intl.DateTimeFormat('fr-FR', { timeZone: timezone }).format(new Date())
  } catch {
    throw new MarketplaceError('VALIDATION_ERROR', 'Le fuseau horaire IANA est invalide.', {
      fieldErrors: { timezone: ['Exemple : Africa/Casablanca.'] },
    })
  }
  return timezone
}

export function optionalIsoDate(value: unknown, field: string): string | null {
  const text = cleanOptionalText(value, 80)
  if (!text) return null
  const date = new Date(text)
  if (Number.isNaN(date.getTime())) {
    throw new MarketplaceError('VALIDATION_ERROR', 'La date fournie est invalide.', {
      fieldErrors: { [field]: ['Utilisez une date ISO valide.'] },
    })
  }
  return date.toISOString()
}

export function asNumber(value: unknown, fallback: number, min: number, max: number): number {
  const parsed = Number(value)
  if (!Number.isFinite(parsed)) return fallback
  return Math.min(max, Math.max(min, parsed))
}
