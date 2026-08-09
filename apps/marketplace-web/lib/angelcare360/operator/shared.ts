import { createClient } from '@/lib/supabase/server'

export type OperatorRow = Record<string, unknown>

export async function getOperatorClient() {
  return createClient()
}

export function asString(value: unknown, fallback = '') {
  if (value === null || value === undefined) return fallback
  if (typeof value === 'string') return value
  if (typeof value === 'number' || typeof value === 'boolean') return String(value)
  return fallback
}

export function asNumber(value: unknown, fallback = 0) {
  if (typeof value === 'number' && Number.isFinite(value)) return value
  if (typeof value === 'string' && value.trim() !== '' && !Number.isNaN(Number(value))) return Number(value)
  return fallback
}

export function asMaybeNumber(value: unknown) {
  const parsed = asNumber(value, NaN)
  return Number.isNaN(parsed) ? null : parsed
}

export function asStringArray(value: unknown) {
  if (Array.isArray(value)) {
    return value.filter((item): item is string => typeof item === 'string').map((item) => item.trim()).filter(Boolean)
  }
  if (typeof value === 'string' && value.trim()) {
    return value.split(',').map((item) => item.trim()).filter(Boolean)
  }
  return []
}

export function toRecord(value: unknown) {
  return (value && typeof value === 'object' && !Array.isArray(value) ? value : {}) as OperatorRow
}

export function isPresent(value: unknown) {
  return value !== null && value !== undefined && String(value).trim() !== ''
}

export async function safeCount(table: string, filters?: Array<[string, 'eq' | 'gte' | 'lte' | 'in', unknown]>) {
  const supabase = await getOperatorClient()
  let query = supabase.from(table).select('id', { head: true, count: 'exact' })
  for (const [column, operator, value] of filters || []) {
    if (operator === 'eq') query = query.eq(column, value as never)
    if (operator === 'gte') query = query.gte(column, value as never)
    if (operator === 'lte') query = query.lte(column, value as never)
    if (operator === 'in' && Array.isArray(value)) query = query.in(column, value as never[])
  }
  const { count, error } = await query
  if (error) return 0
  return count || 0
}

export async function safeList(table: string, select = '*', filters?: Array<[string, 'eq' | 'gte' | 'lte' | 'in', unknown]>, orderBy?: [string, { ascending?: boolean }], limit?: number) {
  const supabase = await getOperatorClient()
  let query = supabase.from(table).select(select)
  for (const [column, operator, value] of filters || []) {
    if (operator === 'eq') query = query.eq(column, value as never)
    if (operator === 'gte') query = query.gte(column, value as never)
    if (operator === 'lte') query = query.lte(column, value as never)
    if (operator === 'in' && Array.isArray(value)) query = query.in(column, value as never[])
  }
  if (orderBy) {
    query = query.order(orderBy[0], orderBy[1])
  }
  if (typeof limit === 'number') {
    query = query.limit(limit)
  }
  const { data, error } = await query
  if (error) return []
  return (data || []) as any[]
}

export function summarizeMoney(values: Array<unknown>): number {
  return values.reduce((sum: number, value) => sum + asNumber(value, 0), 0)
}

export function formatMoney(value: number | string | null | undefined) {
  return asNumber(value, 0).toLocaleString('fr-FR')
}

export function statusTone(status: string): 'info' | 'warning' | 'critical' | 'success' {
  const normalized = String(status).toLowerCase()
  if (['active', 'enabled', 'confirmed', 'paid', 'signed', 'resolved', 'renewed', 'done', 'live'].includes(normalized)) return 'success'
  if (['pilot', 'trial', 'draft', 'new', 'todo', 'upcoming', 'scheduled', 'requires_configuration', 'pending'].includes(normalized)) return 'info'
  if (['warning', 'at_risk', 'past_due', 'blocked', 'triage', 'waiting_client', 'waiting_internal', 'in_discussion', 'proposal_sent'].includes(normalized)) return 'warning'
  return 'critical'
}
