import { MarketplaceError } from '../server/errors'
import type {
  CsvTemplateDocument,
  ExperienceFieldBlueprint,
  ExperienceSchemaBlueprint,
  RowValidationResult,
} from './types'

const TRUE_VALUES = new Set(['true', '1', 'yes', 'oui', 'on'])
const FALSE_VALUES = new Set(['false', '0', 'no', 'non', 'off'])

export function categoryNativeText(value: unknown, max = 4000): string {
  return String(value ?? '').trim().slice(0, max)
}

export function categoryNativeOptionalText(value: unknown, max = 4000): string | null {
  const result = categoryNativeText(value, max)
  return result || null
}

export function categoryNativeBoolean(value: unknown): boolean | null {
  if (typeof value === 'boolean') return value
  const normalized = categoryNativeText(value).toLowerCase()
  if (!normalized) return null
  if (TRUE_VALUES.has(normalized)) return true
  if (FALSE_VALUES.has(normalized)) return false
  return null
}

export function categoryNativeNumber(value: unknown): number | null {
  if (value === null || value === undefined || value === '') return null
  const normalized = typeof value === 'string'
    ? value.replace(/\s/g, '').replace(',', '.')
    : value
  const result = Number(normalized)
  return Number.isFinite(result) ? result : null
}

export function categoryNativeList(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.map((entry) => categoryNativeText(entry)).filter(Boolean)
  }
  const source = categoryNativeText(value)
  if (!source) return []
  return source
    .split(/[|;]+/)
    .map((entry) => entry.trim())
    .filter(Boolean)
}

export function categoryNativeObject(value: unknown): Record<string, unknown> {
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    return value as Record<string, unknown>
  }
  const source = categoryNativeText(value)
  if (!source) return {}
  try {
    const parsed: unknown = JSON.parse(source)
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed)
      ? parsed as Record<string, unknown>
      : {}
  } catch {
    return {}
  }
}

function normalizeField(
  field: ExperienceFieldBlueprint,
  value: unknown,
): { value: unknown; error: string | null } {
  const empty = value === null || value === undefined || categoryNativeText(value) === ''
  if (empty) return { value: field.default_value ?? null, error: null }

  if (field.field_type === 'boolean') {
    const result = categoryNativeBoolean(value)
    return result === null
      ? { value: null, error: `${field.label_fr} doit être oui/non.` }
      : { value: result, error: null }
  }

  if (['number', 'integer', 'money'].includes(field.field_type)) {
    const result = categoryNativeNumber(value)
    if (result === null) return { value: null, error: `${field.label_fr} doit être numérique.` }
    const minimum = categoryNativeNumber(field.validation.min)
    const maximum = categoryNativeNumber(field.validation.max)
    if (minimum !== null && result < minimum) {
      return { value: result, error: `${field.label_fr} doit être supérieur ou égal à ${minimum}.` }
    }
    if (maximum !== null && result > maximum) {
      return { value: result, error: `${field.label_fr} doit être inférieur ou égal à ${maximum}.` }
    }
    return {
      value: field.field_type === 'integer' ? Math.trunc(result) : result,
      error: null,
    }
  }

  if (['multiselect', 'list', 'territory_list', 'media_list'].includes(field.field_type)) {
    const result = categoryNativeList(value)
    if (field.allowed_values.length) {
      const invalid = result.filter((entry) => !field.allowed_values.includes(entry))
      if (invalid.length) {
        return {
          value: result,
          error: `${field.label_fr} contient des valeurs non autorisées : ${invalid.join(', ')}.`,
        }
      }
    }
    return { value: result, error: null }
  }

  if (['json', 'component_list', 'time_ranges'].includes(field.field_type)) {
    const parsed = categoryNativeObject(value)
    if (!Object.keys(parsed).length && categoryNativeText(value)) {
      return { value: {}, error: `${field.label_fr} contient un JSON invalide.` }
    }
    return { value: parsed, error: null }
  }

  const result = categoryNativeText(value)
  if (field.allowed_values.length && !field.allowed_values.includes(result)) {
    return {
      value: result,
      error: `${field.label_fr} doit être l’une des valeurs suivantes : ${field.allowed_values.join(', ')}.`,
    }
  }

  const pattern = categoryNativeText(field.validation.pattern)
  if (pattern) {
    try {
      if (!new RegExp(pattern).test(result)) {
        return { value: result, error: `${field.label_fr} ne respecte pas le format requis.` }
      }
    } catch {
      // A malformed registry pattern must not crash an import. It is surfaced by schema QA.
    }
  }

  return { value: result, error: null }
}

export function validateCategoryNativeRow(
  schema: ExperienceSchemaBlueprint,
  row: Record<string, unknown>,
  rowNumber: number,
): RowValidationResult {
  const normalized: Record<string, unknown> = {
    template_version: categoryNativeNumber(row.template_version) ?? schema.version,
    schema_key: categoryNativeText(row.schema_key) || schema.schema_key,
  }
  const errors: string[] = []
  const warnings: string[] = []

  if (normalized.schema_key !== schema.schema_key) {
    errors.push(`Le schema_key attendu est ${schema.schema_key}.`)
  }
  if (normalized.template_version !== schema.version) {
    warnings.push(`Le template est en version ${String(normalized.template_version)} alors que le schéma actif est en version ${schema.version}.`)
  }

  for (const field of schema.fields.filter((entry) => entry.csv_enabled)) {
    const raw = row[field.field_key]
    const empty = raw === null || raw === undefined || categoryNativeText(raw) === ''
    if (field.required && empty && field.default_value === null) {
      errors.push(`${field.label_fr} est requis.`)
      normalized[field.field_key] = null
      continue
    }
    const result = normalizeField(field, raw)
    normalized[field.field_key] = result.value
    if (result.error) errors.push(result.error)
  }

  const identityField = categoryNativeText(schema.configuration.identity_field)
  const identityValue = identityField ? categoryNativeText(normalized[identityField]) : ''
  if (!identityValue) {
    errors.push(`La clé d’identité ${identityField || 'item_key'} est requise.`)
  }

  const priceMode = categoryNativeText(normalized.price_mode || normalized.pricing_mode)
  const priceValue = categoryNativeNumber(
    normalized.price_amount ?? normalized.starting_price_dh ?? normalized.recurring_fee_dh,
  )
  if (priceMode && !['quote_only', 'free'].includes(priceMode) && priceValue === null) {
    warnings.push('Un mode de prix visible est défini sans montant de référence.')
  }

  const categoryKeys = categoryNativeList(normalized.category_keys)
  if (!categoryKeys.length) warnings.push('Aucune catégorie canonique n’est renseignée.')

  const mediaReference = categoryNativeText(normalized.primary_image_reference)
  if (!mediaReference && schema.media_requirements.primary === true) {
    errors.push('Une image principale Media Library est requise.')
  }

  return {
    rowNumber,
    identityKey: identityValue || null,
    valid: errors.length === 0,
    normalized,
    errors,
    warnings,
  }
}

export function parseCategoryNativeCsv(source: string): Record<string, unknown>[] {
  const rows: string[][] = []
  let currentRow: string[] = []
  let currentField = ''
  let quoted = false

  const normalizedSource = source.replace(/^\uFEFF/, '')
  for (let index = 0; index < normalizedSource.length; index += 1) {
    const character = normalizedSource[index]
    if (quoted) {
      if (character === '"' && normalizedSource[index + 1] === '"') {
        currentField += '"'
        index += 1
      } else if (character === '"') {
        quoted = false
      } else {
        currentField += character
      }
      continue
    }
    if (character === '"') quoted = true
    else if (character === ',') {
      currentRow.push(currentField)
      currentField = ''
    } else if (character === '\n') {
      currentRow.push(currentField.replace(/\r$/, ''))
      rows.push(currentRow)
      currentRow = []
      currentField = ''
    } else currentField += character
  }
  if (currentField || currentRow.length) {
    currentRow.push(currentField.replace(/\r$/, ''))
    rows.push(currentRow)
  }
  if (quoted) throw new MarketplaceError('VALIDATION_ERROR', 'Le CSV contient une cellule non fermée.')

  const headers = (rows.shift() || []).map((header) => header.trim())
  if (!headers.length || headers.some((header) => !header)) {
    throw new MarketplaceError('VALIDATION_ERROR', 'Le CSV doit contenir une ligne d’en-têtes complète.')
  }
  if (new Set(headers).size !== headers.length) {
    throw new MarketplaceError('VALIDATION_ERROR', 'Le CSV contient des colonnes dupliquées.')
  }

  return rows
    .filter((values) => values.some((value) => value.trim()))
    .map((values) => Object.fromEntries(headers.map((header, index) => [header, values[index] ?? ''])))
}

function csvEscape(value: unknown): string {
  const rendered = value === null || value === undefined
    ? ''
    : Array.isArray(value)
      ? value.join('|')
      : typeof value === 'object'
        ? JSON.stringify(value)
        : String(value)
  return /[",\n]/.test(rendered)
    ? `"${rendered.replace(/"/g, '""')}"`
    : rendered
}

export function categoryNativeCsvTemplate(
  schema: ExperienceSchemaBlueprint,
): CsvTemplateDocument {
  const fields = schema.fields.filter((field) => field.csv_enabled)
  const headers = ['template_version', 'schema_key', ...fields.map((field) => field.field_key)]
  const example: Record<string, unknown> = {
    template_version: schema.version,
    schema_key: schema.schema_key,
  }

  for (const field of fields) {
    if (field.default_value !== null && field.default_value !== undefined) {
      example[field.field_key] = field.default_value
    } else if (field.allowed_values.length) {
      example[field.field_key] = field.field_type === 'multiselect'
        ? field.allowed_values.slice(0, 2).join('|')
        : field.allowed_values[0]
    } else if (field.field_type === 'boolean') {
      example[field.field_key] = false
    } else if (['number', 'integer', 'money'].includes(field.field_type)) {
      example[field.field_key] = 0
    } else {
      example[field.field_key] = ''
    }
  }

  const csv = `\uFEFF${headers.join(',')}\n${headers.map((header) => csvEscape(example[header])).join(',')}\n`
  return {
    schemaKey: schema.schema_key,
    version: schema.version,
    fileName: `${schema.schema_key.toUpperCase().replace(/-/g, '_')}.csv`,
    headers,
    example,
    fieldGuide: fields.map((field) => ({
      key: field.field_key,
      label: field.label_fr,
      type: field.field_type,
      required: field.required,
      allowedValues: field.allowed_values,
      help: field.help_fr,
    })),
    csv,
  }
}

export function assertCategoryNativeSchemaKey(value: unknown): string {
  const key = categoryNativeText(value, 160)
  if (!/^[a-z0-9][a-z0-9-]{2,159}$/.test(key)) {
    throw new MarketplaceError('VALIDATION_ERROR', 'Clé de schéma invalide.')
  }
  return key
}
