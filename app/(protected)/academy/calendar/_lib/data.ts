
import { createClient } from '@/lib/supabase/server'
import { ACADEMY_MODULES, getAcademyModule, type AcademyModuleKey } from './config'

export type AcademyRow = Record<string, any>

export async function getAcademyRows(moduleKey: AcademyModuleKey, limit = 20) {
  const supabase = await createClient()
  const module = getAcademyModule(moduleKey)
  const { data, error } = await supabase.from(module.table).select('*').order('created_at', { ascending: false }).limit(limit)
  if (error) return { rows: [] as AcademyRow[], error: error.message }
  return { rows: (data || []) as AcademyRow[], error: null as string | null }
}

export async function getAcademyDashboardData() {
  const supabase = await createClient()
  const result: Record<string, { count: number; rows: AcademyRow[]; error?: string | null }> = {}
  await Promise.all(ACADEMY_MODULES.map(async (module) => {
    const { count, data, error } = await supabase.from(module.table).select('*', { count: 'exact' }).order('created_at', { ascending: false }).limit(6)
    result[module.key] = { count: count || 0, rows: (data || []) as AcademyRow[], error: error?.message || null }
  }))
  return result
}

export function displayName(row: AcademyRow) {
  return row.full_name || row.name || row.title || row.certificate_number || row.serial_number || row.stage || row.id || 'Academy record'
}

export function displayStatus(row: AcademyRow) {
  return row.status || row.eligibility_status || row.severity || 'active'
}

export function rowSubtitle(row: AcademyRow) {
  return [row.city, row.category, row.level, row.source, row.method, row.specialty, row.type, row.stage, row.location].filter(Boolean).join(' • ') || row.notes || row.message || row.description || 'Operational Academy record'
}
