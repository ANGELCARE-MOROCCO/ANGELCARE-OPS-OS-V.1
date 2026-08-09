import { MarketplaceError } from '../server/errors'
import type { CatalogLocale } from '../catalog-discovery/types'
import type { ExperienceFieldBlueprint, ExperienceSchemaBlueprint } from '../category-native/types'
import type { CategoryNativeConfigurationValidation } from './types'

export function categoryNativeLocale(value: unknown): CatalogLocale {
  return value === 'en' || value === 'ar' ? value : 'fr'
}

function object(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? value as Record<string, unknown>
    : {}
}

function activeByCondition(field: ExperienceFieldBlueprint, values: Record<string, unknown>): boolean {
  const rule = object(field.validation.conditional_rule)
  if (!Object.keys(rule).length) return true
  const dependsOn = typeof rule.depends_on === 'string' ? rule.depends_on : ''
  if (!dependsOn) return true
  const expected = rule.equals
  return values[dependsOn] === expected
}

function normalizeField(field: ExperienceFieldBlueprint, value: unknown): unknown {
  if (value === undefined || value === null || value === '') return field.default_value ?? null
  switch (field.field_type) {
    case 'number':
    case 'integer':
    case 'money': {
      const numberValue = Number(value)
      return Number.isFinite(numberValue) ? numberValue : value
    }
    case 'boolean':
      return value === true || value === 'true' || value === 1 || value === '1'
    case 'multiselect':
    case 'list':
    case 'territory_list':
      return Array.isArray(value) ? value.map(String) : String(value).split('|').map((entry) => entry.trim()).filter(Boolean)
    default:
      return typeof value === 'string' ? value.trim() : value
  }
}

function fieldError(field: ExperienceFieldBlueprint, value: unknown): string | null {
  if (field.required && (value === null || value === undefined || value === '' || (Array.isArray(value) && value.length === 0))) {
    return `${field.label_fr} est requis.`
  }
  if (value === null || value === undefined || value === '') return null
  if (field.allowed_values.length && !Array.isArray(value) && !field.allowed_values.includes(String(value))) {
    return `${field.label_fr} contient une valeur non autorisée.`
  }
  const validation = field.validation
  if (typeof value === 'number') {
    if (typeof validation.min === 'number' && value < validation.min) return `${field.label_fr} doit être supérieur ou égal à ${validation.min}.`
    if (typeof validation.max === 'number' && value > validation.max) return `${field.label_fr} doit être inférieur ou égal à ${validation.max}.`
  }
  if (typeof value === 'string' && typeof validation.pattern === 'string') {
    try { if (!new RegExp(validation.pattern).test(value)) return `${field.label_fr} ne respecte pas le format attendu.` } catch { return null }
  }
  return null
}

export function validateCategoryNativeConfiguration(
  schema: ExperienceSchemaBlueprint,
  configuration: Record<string, unknown>,
): CategoryNativeConfigurationValidation {
  const normalized: Record<string, unknown> = {}
  const errors: Record<string, string> = {}
  const warnings: string[] = []
  for (const field of schema.fields) {
    if (!activeByCondition(field, configuration)) continue
    const value = normalizeField(field, configuration[field.field_key])
    normalized[field.field_key] = value
    const error = fieldError(field, value)
    if (error) errors[field.field_key] = error
  }
  const unknown = Object.keys(configuration).filter((key) => !schema.fields.some((field) => field.field_key === key))
  if (unknown.length) warnings.push(`Champs ignorés : ${unknown.join(', ')}`)
  return { valid: Object.keys(errors).length === 0, normalized, errors, warnings }
}

export function assertValidCategoryNativeConfiguration(
  schema: ExperienceSchemaBlueprint,
  configuration: Record<string, unknown>,
) {
  const result = validateCategoryNativeConfiguration(schema, configuration)
  if (!result.valid) {
    throw new MarketplaceError('VALIDATION_ERROR', 'La configuration contient des champs requis ou invalides.', { fieldErrors: Object.fromEntries(Object.entries(result.errors).map(([key, message]) => [key, [message]])) })
  }
  return result
}

export function formatCategoryNativeValue(field: ExperienceFieldBlueprint, value: unknown, locale: CatalogLocale): string {
  if (value === null || value === undefined || value === '') return '—'
  if (Array.isArray(value)) return value.join(' · ')
  if (field.field_type === 'boolean') return value ? (locale === 'fr' ? 'Oui' : locale === 'ar' ? 'نعم' : 'Yes') : (locale === 'fr' ? 'Non' : locale === 'ar' ? 'لا' : 'No')
  if (field.field_type === 'money' && typeof value === 'number') return `${new Intl.NumberFormat(locale).format(value)} Dh`
  return String(value)
}
