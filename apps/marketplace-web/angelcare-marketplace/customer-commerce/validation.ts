import { MarketplaceError } from '../server/errors'
import type { CatalogLocale } from '../catalog-discovery/types'
import type { PaymentMethodKind } from './types'

export function localeValue(value: unknown): CatalogLocale {
  return value === 'en' || value === 'ar' ? value : 'fr'
}

export function requiredText(value: unknown, field: string, max = 500): string {
  const normalized = String(value ?? '').trim().slice(0, max)
  if (!normalized) throw new MarketplaceError('VALIDATION_ERROR', `${field} est requis.`, { fieldErrors: { [field]: [`${field} est requis.`] } })
  return normalized
}

export function optionalText(value: unknown, max = 500): string | null {
  const normalized = String(value ?? '').trim().slice(0, max)
  return normalized || null
}

export function positiveMoney(value: unknown, field = 'amount', maximum = 1_000_000): number {
  const amount = Math.round(Number(value) * 100) / 100
  if (!Number.isFinite(amount) || amount <= 0 || amount > maximum) {
    throw new MarketplaceError('VALIDATION_ERROR', `Le montant ${field} est invalide.`)
  }
  return amount
}

export function emailValue(value: unknown): string {
  const email = String(value || '').trim().toLowerCase()
  if (!/^\S+@\S+\.\S+$/.test(email)) throw new MarketplaceError('VALIDATION_ERROR', 'Une adresse email valide est requise.')
  return email.slice(0, 320)
}

export function phoneValue(value: unknown): string | null {
  const phone = String(value || '').trim().replace(/[^+\d]/g, '')
  if (!phone) return null
  if (phone.length < 8 || phone.length > 18) throw new MarketplaceError('VALIDATION_ERROR', 'Le numéro de téléphone est invalide.')
  return phone
}

export function passwordValue(value: unknown): string {
  const password = String(value || '')
  if (password.length < 10 || !/[A-Z]/.test(password) || !/[a-z]/.test(password) || !/\d/.test(password)) {
    throw new MarketplaceError('VALIDATION_ERROR', 'Le mot de passe doit contenir au moins 10 caractères, une majuscule, une minuscule et un chiffre.')
  }
  return password
}

export const PAYMENT_METHODS = new Set<PaymentMethodKind>([
  'ac_wallet','card','bank_transfer','cash_on_delivery','pay_at_location','invoice','deposit','installment','corporate_allowance','voucher','manual_verified',
])

export function paymentMethod(value: unknown): PaymentMethodKind {
  const method = String(value || '') as PaymentMethodKind
  if (!PAYMENT_METHODS.has(method)) throw new MarketplaceError('VALIDATION_ERROR', 'Le moyen de paiement est invalide.')
  return method
}

export function objectValue(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : {}
}

export function stringArray(value: unknown): string[] {
  return Array.isArray(value) ? [...new Set(value.map(String).map((item) => item.trim()).filter(Boolean))] : []
}
