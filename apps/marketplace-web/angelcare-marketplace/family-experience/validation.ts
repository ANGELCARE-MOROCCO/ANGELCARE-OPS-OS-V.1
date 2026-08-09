import { MarketplaceError } from '../server/errors'

export function requireDate(value: unknown, field: string, label: string): string {
  const text = String(value || '').trim()
  if (!/^\d{4}-\d{2}-\d{2}$/.test(text)) throw new MarketplaceError('VALIDATION_ERROR', `${label} est invalide.`, { fieldErrors: { [field]: [`${label} est requis au format AAAA-MM-JJ.`] } })
  return text
}

export function stringArray(value: unknown, max = 20): string[] {
  if (!Array.isArray(value)) return []
  return [...new Set(value.map((item) => String(item).trim()).filter(Boolean))].slice(0, max)
}

export function recordValue(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : {}
}

export function validateDiagnostic(input: { developmentGoals: string[]; routineNeeds: string[]; familyPriorities: string[] }) {
  if (!input.developmentGoals.length && !input.routineNeeds.length && !input.familyPriorities.length) throw new MarketplaceError('VALIDATION_ERROR', 'Sélectionnez au moins un objectif ou une priorité.')
}
