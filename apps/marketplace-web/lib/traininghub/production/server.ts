import { createClient } from '@supabase/supabase-js'

export type Row = Record<string, any>

export function adminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !key) return null
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } }) as any
}

export function now() {
  return new Date().toISOString()
}

export function code(prefix: string) {
  return `${prefix}-${new Date().toISOString().replace(/[-:.TZ]/g, '').slice(0, 14)}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`
}

export function text(value: unknown, fallback = '') {
  const t = String(value ?? '').trim()
  return t || fallback
}

export function minor(value: unknown) {
  const n = Number(value || 0)
  return Number.isFinite(n) ? Math.round(n * 100) : 0
}

function parse(message: string) {
  const missing = message.match(/Could not find the '([^']+)' column/i) || message.match(/column [^.\s]+\.([a-zA-Z0-9_]+) does not exist/i)
  if (missing?.[1]) return { type: 'missing', column: missing[1] }
  const notNull = message.match(/null value in column "([^"]+)"/i)
  if (notNull?.[1]) return { type: 'notnull', column: notNull[1] }
  return null
}

function fallback(column: string, row: Row) {
  if (column.endsWith('_id')) return row.organization_id || row.partner_id || row.account_id || null
  if (column.includes('number')) return code(column.toUpperCase().slice(0, 10))
  if (column.includes('code')) return code(column.toUpperCase().slice(0, 8))
  if (column.includes('currency')) return 'MAD'
  if (column.includes('status')) return 'draft'
  if (column.includes('type')) return 'training_course'
  if (column.includes('source')) return 'traininghub'
  if (column.includes('title') || column.includes('name')) return 'TrainingHub'
  if (column.includes('amount') || column.includes('total') || column.includes('minor') || column.includes('quantity')) return 0
  if (column.includes('metadata') || column.includes('payload')) return {}
  if (column.endsWith('_at') || column.includes('date')) return now()
  if (column.startsWith('is_')) return false
  return 'traininghub'
}

export async function selectRows(supabase: any, table: string, eq?: [string, any], limit = 100) {
  try {
    let q = supabase.from(table).select('*')
    if (eq && eq[1]) q = q.eq(eq[0], eq[1])
    if (limit) q = q.limit(limit)
    const { data, error } = await q
    if (error) return { ok: false, data: [], error: error.message }
    return { ok: true, data: Array.isArray(data) ? data : [] }
  } catch (error: any) {
    return { ok: false, data: [], error: error?.message || String(error) }
  }
}

export async function countRows(supabase: any, table: string) {
  try {
    const { count, error } = await supabase.from(table).select('*', { count: 'exact', head: true })
    return error ? 0 : Number(count || 0)
  } catch {
    return 0
  }
}

export async function insertRow(supabase: any, table: string, payload: Row) {
  let row: Row = JSON.parse(JSON.stringify(payload || {}))
  const attempts: string[] = []
  for (let i = 0; i < 18; i++) {
    const { data, error } = await supabase.from(table).insert(row).select('*').maybeSingle()
    attempts.push(`${table}:${Object.keys(row).join(',')}`)
    if (!error) return { ok: true, data, attempts }
    const p = parse(error.message || String(error))
    if (p?.type === 'missing') {
      delete row[p.column]
      continue
    }
    if (p?.type === 'notnull') {
      row[p.column] = fallback(p.column, row)
      continue
    }
    return { ok: false, error: error.message || String(error), attempts }
  }
  return { ok: false, error: `Insert failed for ${table}`, attempts }
}

export async function updateRow(supabase: any, table: string, id: string, payload: Row) {
  let row: Row = JSON.parse(JSON.stringify(payload || {}))
  for (let i = 0; i < 12; i++) {
    const { data, error } = await supabase.from(table).update(row).eq('id', id).select('*').maybeSingle()
    if (!error) return { ok: true, data }
    const p = parse(error.message || String(error))
    if (p?.type === 'missing') {
      delete row[p.column]
      continue
    }
    return { ok: false, error: error.message || String(error) }
  }
  return { ok: false, error: `Update failed for ${table}` }
}

export async function insertAny(supabase: any, tables: string[], payload: Row) {
  const errors: string[] = []
  for (const table of tables) {
    const result = await insertRow(supabase, table, payload)
    if (result.ok) return { ...result, table }
    errors.push(`${table}: ${result.error}`)
  }
  return { ok: false, error: errors.join(' | ') }
}

export async function logEvent(supabase: any, payload: Row) {
  const event = {
    module: text(payload.module, 'traininghub'),
    action: text(payload.action, 'event'),
    entity_id: payload.entity_id || null,
    organization_id: payload.organization_id || null,
    status: text(payload.status, 'recorded'),
    notes: payload.notes || null,
    metadata: payload,
    created_at: now(),
  }
  const saved = await insertRow(supabase, 'traininghub_internal_actions', event)
  if (saved.ok) return saved
  return insertRow(supabase, 'partner_activity_events', {
    organization_id: event.organization_id,
    event_type: `traininghub.${event.module}.${event.action}`,
    title: event.action,
    body: event.notes,
    metadata: event,
    created_at: event.created_at,
  })
}
