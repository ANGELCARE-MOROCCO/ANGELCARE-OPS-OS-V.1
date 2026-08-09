import { MarketplaceError } from '../server/errors'
import type { CommerceLocale, CommerceResource } from './types'

export const commerceResources: CommerceResource[] = [
  'media','media-folders','homepage-sections','homepage-campaigns','homepage-collections',
  'homepage-collection-items','homepage-placements','navigation-menus','navigation-items',
  'catalog-items','catalog-media','catalog-variants','catalog-availability','catalog-categories',
  'catalog-item-categories','catalog-attributes','price-rules','merchandising-rules','versions',
  'publication-events','cache-events',
]

export function commerceResource(value: string): CommerceResource {
  if (!commerceResources.includes(value as CommerceResource)) {
    throw new MarketplaceError('VALIDATION_ERROR', 'Ressource Commerce Studio inconnue.')
  }
  return value as CommerceResource
}

export function locale(value: unknown): CommerceLocale {
  return value === 'en' || value === 'ar' ? value : 'fr'
}

export function safeBoolean(value: unknown, fallback = false): boolean {
  if (typeof value === 'boolean') return value
  if (value === 'true' || value === '1' || value === 1) return true
  if (value === 'false' || value === '0' || value === 0) return false
  return fallback
}

export function safeNumber(value: unknown, fallback = 0): number {
  const result = Number(value)
  return Number.isFinite(result) ? result : fallback
}

export function safeJson(value: unknown): Record<string, unknown> {
  if (value && typeof value === 'object' && !Array.isArray(value)) return value as Record<string, unknown>
  if (typeof value !== 'string' || !value.trim()) return {}
  try {
    const parsed: unknown = JSON.parse(value)
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed)
      ? parsed as Record<string, unknown>
      : {}
  } catch {
    throw new MarketplaceError('VALIDATION_ERROR', 'Le JSON fourni est invalide.')
  }
}

export function safeArray(value: unknown): string[] {
  if (Array.isArray(value)) return value.map(String).map((item) => item.trim()).filter(Boolean)
  if (typeof value === 'string') return value.split(',').map((item) => item.trim()).filter(Boolean)
  return []
}

export function slugify(value: string): string {
  return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
    .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 180)
}

export function assertInternalOrHttpUrl(value: string, field: string): string {
  const url = value.trim()
  if (!url) throw new MarketplaceError('VALIDATION_ERROR', `${field} est requis.`)
  if (url.startsWith('/')) return url
  try {
    const parsed = new URL(url)
    if (parsed.protocol === 'https:' || parsed.protocol === 'http:') return url
  } catch {
    // handled below
  }
  throw new MarketplaceError('VALIDATION_ERROR', `${field} doit être une route interne ou une URL HTTP(S).`)
}

export function sanitizeFileName(value: string): string {
  const extension = value.includes('.') ? `.${value.split('.').pop()}` : ''
  const base = value.replace(/\.[^.]+$/, '')
  const clean = slugify(base) || 'media'
  return `${clean}-${crypto.randomUUID().slice(0, 8)}${extension.toLowerCase()}`
}
