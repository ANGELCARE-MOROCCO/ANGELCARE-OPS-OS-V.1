import type { CatalogLocale } from '../catalog-discovery/types'

export const CUSTOMER_ACCESS_REVISION = 'customer-access-premium-r1-20261007'
export const CUSTOMER_LOGO = '/angelcare-marketplace/customer-access/angelcare-official-logo.png'
export type CustomerAuthMode = 'login' | 'register' | 'recover' | 'reset'

/** Keep navigation local to the public/customer Marketplace. Never accept an origin. */
export function customerReturnTo(value: unknown, locale: CatalogLocale): string {
  const fallback = `/angelcare-marketplace/${locale}/account`
  if (typeof value !== 'string' || value.length > 1600) return fallback
  const candidate = value.trim()
  if (/[\\\u0000-\u0020\u007f]/.test(candidate) || candidate.startsWith('//')) return fallback
  try {
    const url = new URL(candidate, 'https://customer.invalid')
    let decoded = url.pathname
    for (let i = 0; i < 6; i++) { const next = decodeURIComponent(decoded); if (next === decoded) break; decoded = next }
    if (/[\\\u0000-\u0020\u007f]/.test(decoded) || decoded.includes('//') || /%[\da-f]{2}/i.test(decoded)) return fallback
    const normalized = new URL(decoded, 'https://customer.invalid')
    const allowed = /^\/angelcare-marketplace\/(fr|en|ar)(?:\/|$)/
    const forbidden = /^\/angelcare-marketplace\/(fr|en|ar)\/(auth|admin|provider|trainer|workspace|access-denied)(?:\/|$)/
    if (!candidate.startsWith('/') || url.origin !== 'https://customer.invalid' || normalized.origin !== url.origin || !allowed.test(url.pathname) || !allowed.test(normalized.pathname) || forbidden.test(url.pathname) || forbidden.test(normalized.pathname)) return fallback
    return url.pathname + url.search
  } catch { return fallback }
}

export function customerAuthHref(locale: CatalogLocale, mode: CustomerAuthMode | 'verified', returnTo?: unknown): string {
  return `/angelcare-marketplace/${locale}/auth/${mode}?returnTo=${encodeURIComponent(customerReturnTo(returnTo, locale))}`
}

export function customerLocaleReturnTo(value: unknown, locale: CatalogLocale): string {
  return customerReturnTo(value, locale).replace(/^\/angelcare-marketplace\/(fr|en|ar)(?=\/|$)/, `/angelcare-marketplace/${locale}`)
}

export function passwordChecks(value: string): readonly boolean[] {
  return [value.length >= 10, /[A-Z]/.test(value), /[a-z]/.test(value), /\d/.test(value)]
}
