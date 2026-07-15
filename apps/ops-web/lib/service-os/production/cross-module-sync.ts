import { createClient } from '@/lib/supabase/server'
import type { ServiceOSBlueprint } from './types'

async function safeCount(table: string, filter?: { column: string; value: string }) {
  try {
    const supabase = await createClient()
    let q = supabase.from(table).select('*', { count:'exact', head:true })
    if (filter) q = q.eq(filter.column, filter.value)
    const { count } = await q
    return count || 0
  } catch { return 0 }
}

export async function getServiceOSCrossModuleReadiness(blueprint: ServiceOSBlueprint) {
  const [staff, families, contracts, incidents] = await Promise.all([
    safeCount('hr_staff_profiles'), safeCount('families'), safeCount('contracts'), safeCount('incidents'),
  ])
  const readiness = Math.min(100, Math.round((staff ? 30 : 0) + (families ? 20 : 0) + (contracts ? 20 : 0) + (blueprint.modules.length * 3) + (blueprint.rules.length * 2)))
  return { staff, families, contracts, incidents, readiness, missing: { staff: staff === 0, families: families === 0, contracts: contracts === 0 } }
}
