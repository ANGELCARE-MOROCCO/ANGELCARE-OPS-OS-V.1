import { createClient } from '@/lib/supabase/server'
import { getMissionDossier } from './repository'
import { recordMissionEvent } from './events'

export type MissionOrderPatch = {
  parameters?: Record<string, unknown> | null
  transport?: Record<string, unknown> | null
  allowances?: Record<string, unknown> | null
  routes?: Record<string, unknown>[]
  parameterDays?: Record<string, unknown>[]
  programLines?: Record<string, unknown>[]
}

async function replaceRows(table: string, missionId: number, rows: Record<string, unknown>[]) {
  const supabase = await createClient()
  const { error: deleteError } = await supabase.from(table).delete().eq('mission_id', missionId)
  if (deleteError) throw new Error(deleteError.message)
  if (!rows.length) return []
  const payload = rows.map((row, index) => ({ ...row, mission_id: missionId, sort_order: Number(row.sort_order ?? index) }))
  const { data, error } = await supabase.from(table).insert(payload).select('*')
  if (error) throw new Error(error.message)
  return data || []
}

async function upsertSingle(table: string, missionId: number, payload: Record<string, unknown> | null | undefined) {
  const supabase = await createClient()
  await supabase.from(table).delete().eq('mission_id', missionId)
  if (!payload) return null
  const { data, error } = await supabase.from(table).insert([{ ...payload, mission_id: missionId }]).select('*').maybeSingle()
  if (error) throw new Error(error.message)
  return data
}

export async function getMissionOrder(missionId: number) {
  return await getMissionDossier(missionId)
}

export async function patchMissionOrder(missionId: number, patch: MissionOrderPatch) {
  const changes: Record<string, unknown> = {}
  if ('routes' in patch) changes.routes = await replaceRows('mission_routes', missionId, patch.routes || [])
  if ('parameterDays' in patch) changes.parameterDays = await replaceRows('mission_parameter_days', missionId, patch.parameterDays || [])
  if ('programLines' in patch) changes.programLines = await replaceRows('mission_program_lines', missionId, patch.programLines || [])
  if ('parameters' in patch) changes.parameters = await upsertSingle('mission_parameters', missionId, patch.parameters || null)
  if ('transport' in patch) changes.transport = await upsertSingle('mission_transport', missionId, patch.transport || null)
  if ('allowances' in patch) changes.allowances = await upsertSingle('mission_allowances', missionId, patch.allowances || null)
  await recordMissionEvent({ missionId, eventType: 'mission_order_updated', content: 'Mission order builder updated', metadata: { sections: Object.keys(patch) }, source: 'mission_order_builder' })
  return { ok: true, changes }
}

export async function saveMissionOrderVersion(missionId: number, snapshot: Record<string, unknown>, changeSummary?: string) {
  const supabase = await createClient()
  const { data: latest } = await supabase.from('mission_order_versions').select('version_number').eq('mission_id', missionId).order('version_number', { ascending: false }).limit(1).maybeSingle()
  const version = Number(latest?.version_number || 0) + 1
  const { data, error } = await supabase.from('mission_order_versions').insert([{ mission_id: missionId, version_number: version, snapshot, change_summary: changeSummary || null }]).select('*').single()
  if (error) throw new Error(error.message)
  await recordMissionEvent({ missionId, eventType: 'mission_order_version_saved', content: `Mission order version ${version} saved`, metadata: { version }, source: 'mission_order_builder' })
  return data
}
