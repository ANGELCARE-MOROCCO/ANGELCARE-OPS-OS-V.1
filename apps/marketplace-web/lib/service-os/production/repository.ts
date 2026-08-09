import { createClient } from '@/lib/supabase/server'
import { SERVICE_OS_BLUEPRINTS, SERVICE_OS_CITY_DEPLOYMENTS, SERVICE_OS_MODULES, SERVICE_OS_RULES } from './seeds'
import type { ServiceOSBlueprint, ServiceOSCityDeployment, ServiceOSModule, ServiceOSRule } from './types'

type TableName = 'serviceos_blueprints' | 'serviceos_modules' | 'serviceos_rules' | 'serviceos_city_deployments' | 'serviceos_missions' | 'serviceos_audit_events'

async function safeSelect<T>(table: TableName, fallback: T[]): Promise<T[]> {
  try {
    const supabase = await createClient()
    const { data, error } = await supabase.from(table).select('*')
    if (error || !data) return fallback
    return data as T[]
  } catch {
    return fallback
  }
}

export async function listServiceOSBlueprints() { return safeSelect<ServiceOSBlueprint>('serviceos_blueprints', SERVICE_OS_BLUEPRINTS) }
export async function listServiceOSModules() { return safeSelect<ServiceOSModule>('serviceos_modules', SERVICE_OS_MODULES) }
export async function listServiceOSRules() { return safeSelect<ServiceOSRule>('serviceos_rules', SERVICE_OS_RULES) }
export async function listServiceOSCityDeployments() { return safeSelect<ServiceOSCityDeployment>('serviceos_city_deployments', SERVICE_OS_CITY_DEPLOYMENTS) }

export async function upsertServiceOSRecord<T extends { id: string }>(table: TableName, record: T) {
  const supabase = await createClient()
  const { data, error } = await supabase.from(table).upsert(record, { onConflict: 'id' }).select('*').single()
  if (error) throw new Error(error.message)
  return data as T
}

export async function deleteServiceOSRecord(table: TableName, id: string) {
  const supabase = await createClient()
  const { error } = await supabase.from(table).delete().eq('id', id)
  if (error) throw new Error(error.message)
  return { ok: true }
}

export async function getServiceOSCommandState() {
  const [blueprints, modules, rules, deployments] = await Promise.all([
    listServiceOSBlueprints(), listServiceOSModules(), listServiceOSRules(), listServiceOSCityDeployments(),
  ])
  return { blueprints, modules, rules, deployments }
}
