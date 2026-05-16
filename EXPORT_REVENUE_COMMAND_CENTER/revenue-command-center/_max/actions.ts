'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

type ActionResult = { ok: boolean; message: string; data?: any }

async function db() { return await createClient() }
async function log(action_type: string, related_type: string, related_id: string | null, note: string, metadata: Record<string, any> = {}) {
  try {
    const supabase = await db()
    const { data: userData } = await supabase.auth.getUser()
    await supabase.from('revenue_command_action_logs').insert({ action_type, related_type, related_id, note, actor_id: userData?.user?.id || null, metadata })
  } catch {}
}

function cleanText(v: FormDataEntryValue | null, fallback = '') { return String(v || fallback).trim() }
function cleanNumber(v: FormDataEntryValue | null, fallback = 0) { const n = Number(v || fallback); return Number.isFinite(n) ? n : fallback }

export async function createRevenueRecord(formData: FormData): Promise<ActionResult> {
  const module_key = cleanText(formData.get('module_key'), 'tasks')
  const title = cleanText(formData.get('title'), 'Untitled revenue item')
  const owner = cleanText(formData.get('owner'), 'Revenue Owner')
  const priority = cleanText(formData.get('priority'), 'high')
  const status = cleanText(formData.get('status'), 'active')
  const stage = cleanText(formData.get('stage'), 'intake')
  const value_mad = cleanNumber(formData.get('value_mad'), 0)
  const due_at = cleanText(formData.get('due_at'), '') || null
  const description = cleanText(formData.get('description'), '')
  try {
    const supabase = await db()
    const { data, error } = await supabase.from('revenue_command_records').insert({ module_key, title, owner, priority, status, stage, value_mad, due_at, description, health: priority === 'critical' ? 'risk' : 'on_track', metadata: { source: 'max_v3_workspace' } }).select('*').single()
    if (error) throw error
    await log('record_created', module_key, data?.id || null, `Created ${title}`, { module_key, priority, value_mad })
    revalidatePath('/revenue-command-center')
    revalidatePath(`/revenue-command-center/${module_key}`)
    return { ok: true, message: 'Record created', data }
  } catch (e: any) { return { ok: false, message: e?.message || 'Create failed' } }
}

export async function updateRevenueRecord(formData: FormData): Promise<ActionResult> {
  const id = cleanText(formData.get('id'))
  const module_key = cleanText(formData.get('module_key'), 'tasks')
  const patch: Record<string, any> = { updated_at: new Date().toISOString() }
  for (const key of ['title','owner','priority','status','stage','health','description']) { const v = cleanText(formData.get(key)); if (v) patch[key] = v }
  if (formData.has('value_mad')) patch.value_mad = cleanNumber(formData.get('value_mad'), 0)
  if (formData.has('due_at')) patch.due_at = cleanText(formData.get('due_at')) || null
  try {
    if (!id) throw new Error('Missing record id')
    const supabase = await db()
    const { data, error } = await supabase.from('revenue_command_records').update(patch).eq('id', id).select('*').single()
    if (error) throw error
    await log('record_updated', module_key, id, `Updated ${data?.title || id}`, { patch })
    revalidatePath('/revenue-command-center')
    revalidatePath(`/revenue-command-center/${module_key}`)
    revalidatePath(`/revenue-command-center/${module_key}/${id}`)
    return { ok: true, message: 'Record updated', data }
  } catch (e: any) { return { ok: false, message: e?.message || 'Update failed' } }
}

export async function executeRevenueAction(formData: FormData): Promise<ActionResult> {
  const action = cleanText(formData.get('action'), 'touch')
  const id = cleanText(formData.get('id'))
  const module_key = cleanText(formData.get('module_key'), 'tasks')
  const note = cleanText(formData.get('note'), action)
  const patch: Record<string, any> = { updated_at: new Date().toISOString() }
  if (action === 'complete') { patch.status = 'completed'; patch.health = 'on_track'; patch.completed_at = new Date().toISOString() }
  if (action === 'pause') patch.status = 'paused'
  if (action === 'escalate') { patch.priority = 'critical'; patch.health = 'risk'; patch.stage = 'intervention' }
  if (action === 'archive') patch.status = 'archived'
  if (action === 'recover') { patch.status = 'active'; patch.health = 'recovery'; patch.stage = 'recovery_plan' }
  if (action === 'won') { patch.status = 'won'; patch.stage = 'closed_won'; patch.health = 'on_track' }
  if (action === 'lost') { patch.status = 'lost'; patch.stage = 'closed_lost'; patch.health = 'risk' }
  try {
    if (!id) throw new Error('Missing record id')
    const supabase = await db()
    const { data, error } = await supabase.from('revenue_command_records').update(patch).eq('id', id).select('*').single()
    if (error) throw error
    await log(action, module_key, id, note, { patch })
    revalidatePath('/revenue-command-center')
    revalidatePath(`/revenue-command-center/${module_key}`)
    return { ok: true, message: `Action ${action} executed`, data }
  } catch (e: any) { return { ok: false, message: e?.message || 'Action failed' } }
}

export async function bulkRevenueAction(formData: FormData): Promise<ActionResult> {
  const ids = cleanText(formData.get('ids')).split(',').map(x => x.trim()).filter(Boolean)
  const module_key = cleanText(formData.get('module_key'), 'tasks')
  const action = cleanText(formData.get('action'), 'touch')
  const patch: Record<string, any> = { updated_at: new Date().toISOString() }
  if (action === 'complete') patch.status = 'completed'
  if (action === 'archive') patch.status = 'archived'
  if (action === 'escalate') { patch.priority = 'critical'; patch.health = 'risk' }
  try {
    if (!ids.length) throw new Error('No records selected')
    const supabase = await db()
    const { error } = await supabase.from('revenue_command_records').update(patch).in('id', ids)
    if (error) throw error
    await log(`bulk_${action}`, module_key, null, `Bulk ${action}: ${ids.length} records`, { ids, patch })
    revalidatePath(`/revenue-command-center/${module_key}`)
    return { ok: true, message: `Bulk ${action} completed` }
  } catch (e: any) { return { ok: false, message: e?.message || 'Bulk action failed' } }
}

export async function seedRevenueCommand(): Promise<ActionResult> {
  const rows = [
    ['tasks','Critical follow-up backlog recovery','Ops Lead','critical','active','intervention',0,'risk'],
    ['tasks','Owner SLA cleanup for new intake','Revenue Manager','high','active','execution',0,'recovery'],
    ['prospects','Casa premium care decision-maker mapping','BD Director','critical','active','qualification',125000,'risk'],
    ['prospects','Rabat institutional care partnership lead','Closer Team','high','active','proposal',220000,'on_track'],
    ['campaigns','B2C family acquisition sprint','Marketing Lead','high','active','launch',180000,'on_track'],
    ['appointments','VIP consultation confirmation queue','Sales Coordinator','high','active','confirmation',35000,'recovery'],
    ['follow-ups','Overdue high-value callbacks','SDR Lead','critical','active','overdue',90000,'risk'],
    ['automation','No-owner task escalation rule','Systems Manager','high','active','rule_testing',0,'recovery'],
    ['ai-scoring','Risk scoring review board','Revenue Intelligence','high','active','analysis',0,'on_track'],
    ['management','Workload balancing for BD officers','General Manager','critical','active','manager_review',0,'risk'],
    ['partnerships','Clinic referral agreement pipeline','Partnership Manager','high','active','negotiation',300000,'on_track'],
    ['market-mapping','Casablanca sector coverage gaps','Strategy Lead','high','active','coverage',0,'recovery']
  ].map(([module_key,title,owner,priority,status,stage,value_mad,health]) => ({ module_key,title,owner,priority,status,stage,value_mad,health, description: `${title} - production seed for Revenue Command MAX V3`, metadata: { source: 'max_v3_seed' } }))
  try {
    const supabase = await db()
    const { error } = await supabase.from('revenue_command_records').insert(rows)
    if (error) throw error
    await log('seed_records', 'system', null, 'Seeded Revenue Command MAX V3 records', { count: rows.length })
    revalidatePath('/revenue-command-center')
    return { ok: true, message: 'Seed completed' }
  } catch (e: any) { return { ok: false, message: e?.message || 'Seed failed' } }
}
