import { createClient } from '@/lib/supabase/server'
import { getAngelcare360AccessContext } from './context'
import type { Angelcare360FoundationSignal, Angelcare360FoundationSignals } from '@/types/angelcare360/customer-foundation'

type Row = Record<string, unknown>

function text(value: unknown, fallback = '') { return value === null || value === undefined ? fallback : String(value) }
function severity(value: unknown): Angelcare360FoundationSignal['severity'] {
  const normalized = text(value).toLowerCase()
  if (['critical', 'danger', 'high'].includes(normalized)) return 'critical'
  if (['warning', 'medium', 'watch'].includes(normalized)) return 'warning'
  if (['healthy', 'success', 'low'].includes(normalized)) return 'healthy'
  return 'info'
}
function signal(row: Row, domain: Angelcare360FoundationSignal['domain']): Angelcare360FoundationSignal {
  return {
    id: text(row.id), domain,
    title: text(row.title || row.label, 'Signal à examiner'),
    detail: text(row.detail || row.description || row.reason, 'Aucun détail complémentaire.'),
    severity: severity(row.severity || row.priority || row.status),
    href: row.href ? text(row.href) : null,
    dueAt: row.due_at ? text(row.due_at) : null,
    ownerLabel: row.owner_label ? text(row.owner_label) : null,
    valueLabel: row.value_label ? text(row.value_label) : null,
  }
}

export async function getAngelcare360FoundationSignals(): Promise<Angelcare360FoundationSignals> {
  const context = await getAngelcare360AccessContext()
  const school = context?.school
  if (!context || !school) return { decisions: [], duplicateCases: [], readiness: [], conversions: [], warnings: ['Établissement actif introuvable.'] }
  const client = await createClient()
  const warnings: string[] = []
  async function rows(table: string, limit = 12) {
    const result = await client.from(table).select('*').eq('school_id', school!.id).order('created_at', { ascending: false }).limit(limit)
    if (result.error) { warnings.push(`${table}: ${result.error.message}`); return [] as Row[] }
    return (result.data || []) as Row[]
  }
  const [decisionRows, duplicateRows, readinessRows, conversionRows] = await Promise.all([
    rows('angelcare360_customer_management_decisions'), rows('angelcare360_people_duplicate_cases'),
    rows('angelcare360_customer_readiness_snapshots'), rows('angelcare360_admission_conversion_runs'),
  ])
  return {
    decisions: decisionRows.map((row) => signal(row, 'direction')),
    duplicateCases: duplicateRows.map((row) => signal(row, 'people')),
    readiness: readinessRows.map((row) => signal(row, 'governance')),
    conversions: conversionRows.map((row) => signal(row, 'admissions')),
    warnings,
  }
}
