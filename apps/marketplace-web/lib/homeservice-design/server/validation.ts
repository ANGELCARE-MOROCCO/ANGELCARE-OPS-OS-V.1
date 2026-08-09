export class HsdValidationError extends Error {
  status = 422
  code = 'VALIDATION_ERROR'
  details: string[]
  constructor(message: string, details: string[] = []) {
    super(message)
    this.details = details
  }
}

export function objectInput(value: unknown) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new HsdValidationError('Le contenu transmis doit être un objet structuré.')
  return value as Record<string, unknown>
}

export function text(value: unknown, field: string, options: { min?: number; max?: number; optional?: boolean } = {}) {
  const result = String(value ?? '').trim()
  if (!result && options.optional) return ''
  if (!result) throw new HsdValidationError(`Le champ « ${field} » est obligatoire.`)
  if (options.min && result.length < options.min) throw new HsdValidationError(`Le champ « ${field} » doit contenir au moins ${options.min} caractères.`)
  if (options.max && result.length > options.max) throw new HsdValidationError(`Le champ « ${field} » ne peut pas dépasser ${options.max} caractères.`)
  return result
}

export function code(value: unknown, field = 'code') {
  const result = text(value, field, { min: 2, max: 80 }).toUpperCase().replace(/[^A-Z0-9_-]+/g, '_').replace(/^_+|_+$/g, '')
  if (!result) throw new HsdValidationError(`Le champ « ${field} » ne contient aucun caractère de code valide.`)
  return result
}

export function numberValue(value: unknown, field: string, options: { min?: number; max?: number; integer?: boolean; optional?: boolean } = {}) {
  if ((value === null || value === undefined || value === '') && options.optional) return null
  const parsed = Number(value)
  if (!Number.isFinite(parsed)) throw new HsdValidationError(`Le champ « ${field} » doit être numérique.`)
  if (options.integer && !Number.isInteger(parsed)) throw new HsdValidationError(`Le champ « ${field} » doit être un nombre entier.`)
  if (options.min !== undefined && parsed < options.min) throw new HsdValidationError(`Le champ « ${field} » doit être supérieur ou égal à ${options.min}.`)
  if (options.max !== undefined && parsed > options.max) throw new HsdValidationError(`Le champ « ${field} » doit être inférieur ou égal à ${options.max}.`)
  return parsed
}

export function booleanValue(value: unknown) {
  return value === true || value === 1 || value === '1' || value === 'true' || value === 'yes' || value === 'oui'
}

export function stringArray(value: unknown) {
  if (Array.isArray(value)) return value.map(String).map((item) => item.trim()).filter(Boolean)
  if (typeof value === 'string') return value.split(/[|,;]/).map((item) => item.trim()).filter(Boolean)
  return []
}

export function oneOf<T extends string>(value: unknown, field: string, allowed: readonly T[], fallback?: T) {
  const result = String(value ?? fallback ?? '') as T
  if (!allowed.includes(result)) throw new HsdValidationError(`Valeur non autorisée pour « ${field} »: ${result}.`)
  return result
}

export function timeValue(value: unknown, field: string) {
  const result = text(value, field)
  if (!/^([01]\d|2[0-3]):[0-5]\d(:[0-5]\d)?$/.test(result)) throw new HsdValidationError(`Le champ « ${field} » doit respecter le format HH:MM.`)
  return result.slice(0, 5)
}

export function jsonObject(value: unknown) {
  if (!value) return {}
  if (typeof value === 'object' && !Array.isArray(value)) return value as Record<string, unknown>
  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value)
      return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : {}
    } catch { return {} }
  }
  return {}
}
