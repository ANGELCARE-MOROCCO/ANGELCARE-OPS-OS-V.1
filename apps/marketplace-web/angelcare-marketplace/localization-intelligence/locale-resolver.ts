import { SOURCE_LOCALE, SUPPORTED_LOCALES } from './constants'
import type { LocaleCode, LocaleResolutionInput } from './types'
export function asLocale(value: unknown): LocaleCode | null { const v=String(value||'').toLowerCase(); return SUPPORTED_LOCALES.includes(v as LocaleCode)?v as LocaleCode:null }
export function resolveLocale(input: LocaleResolutionInput): LocaleCode { return asLocale(input.urlLocale)||asLocale(input.userPreference)||asLocale(input.territoryDefault)||asLocale(input.platformDefault)||SOURCE_LOCALE }
export function localeDirection(locale: LocaleCode): 'ltr'|'rtl' { return locale==='ar'?'rtl':'ltr' }
export function canFallback(input:{sensitive:boolean; requested:LocaleCode; available:LocaleCode[]}): boolean { if(input.available.includes(input.requested)) return true; return !input.sensitive && input.available.includes(SOURCE_LOCALE) }
