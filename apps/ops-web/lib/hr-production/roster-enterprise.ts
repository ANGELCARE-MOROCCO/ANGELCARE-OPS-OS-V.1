import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { HR_TABLES, getHRDashboardData, getHRRecord, logHRActivity } from '@/lib/hr-production/repository'

export const ROSTER_TABLES = {
  assignments: 'hr_roster_assignments',
  templates: 'hr_shift_templates',
  conflicts: 'hr_roster_conflicts',
} as const

function text(formData: FormData, key: string) {
  const v = formData.get(key)
  if (v === null || v === undefined) return null
  const s = String(v).trim()
  return s.length ? s : null
}

export function rosterPayload(formData: FormData) {
  return {
    title: text(formData, 'title') || 'Shift',
    staff_id: text(formData, 'staff_id'),
    user_id: text(formData, 'user_id'),
    staff_name: text(formData, 'staff_name'),
    department: text(formData, 'department'),
    city: text(formData, 'city'),
    location: text(formData, 'location'),
    work_date: text(formData, 'work_date'),
    start_time: text(formData, 'start_time'),
    end_time: text(formData, 'end_time'),
    shift_type: text(formData, 'shift_type') || 'standard',
    status: text(formData, 'status') || 'planned',
    repeat_rule: text(formData, 'repeat_rule'),
    repeat_until: text(formData, 'repeat_until'),
    notes: text(formData, 'notes'),
    updated_at: new Date().toISOString(),
  }
}

export async function safeRosterSelect(limit = 700) {
  const supabase = await createClient()
  const attempts = [ROSTER_TABLES.assignments, 'hr_rosters', 'roster_assignments']
  const errors: string[] = []
  for (const t of attempts) {
    const { data, error } = await supabase.from(t).select('*').limit(limit)
    if (!error) return { data: data || [], table: t, error: null }
    errors.push(`${t}: ${error.message}`)
  }
  return { data: [], table: ROSTER_TABLES.assignments, error: errors.join(' | ') }
}

export async function getRosterCommandData() {
  const dashboard = await getHRDashboardData()
  const rosterResult = await safeRosterSelect()
  const rosters = rosterResult.data.length ? rosterResult.data : (Array.isArray(dashboard.rosters) ? dashboard.rosters : [])
  const staff = Array.isArray(dashboard.staff) ? dashboard.staff : []
  const conflicts = rosters.filter((x: any) => String(x.status || x.conflict_status || x.type || '').toLowerCase().match(/conflict|uncovered|missing|overlap/))
  const covered = rosters.filter((x: any) => String(x.status || '').toLowerCase().match(/confirmed|covered|approved/))
  return { dashboard, rosters, staff, conflicts, covered, errors: rosterResult.error ? { rosters: rosterResult.error } : {} }
}

export async function createRosterShiftAction(formData: FormData) {
  'use server'
  const supabase = await createClient()
  const payload = { ...rosterPayload(formData), created_at: new Date().toISOString() }
  const { data, error } = await supabase.from(ROSTER_TABLES.assignments).insert(payload).select('id').single()
  if (error) throw new Error(error.message)
  await logHRActivity({ action: 'roster.shift.created', source_table: ROSTER_TABLES.assignments, record_id: data.id, entity_type: 'roster', entity_id: data.id, payload })
  revalidatePath('/hr/rosters')
  redirect(`/hr/rosters/${data.id}`)
}

export async function updateRosterShiftAction(id: string, formData: FormData) {
  'use server'
  const supabase = await createClient()
  const before = await getHRRecord(ROSTER_TABLES.assignments, id)
  const payload = rosterPayload(formData)
  const { error } = await supabase.from(ROSTER_TABLES.assignments).update(payload).eq('id', id)
  if (error) throw new Error(error.message)
  await logHRActivity({ action: 'roster.shift.updated', source_table: ROSTER_TABLES.assignments, record_id: id, entity_type: 'roster', entity_id: id, before, after: payload })
  revalidatePath('/hr/rosters')
  redirect(`/hr/rosters/${id}`)
}

export async function deleteRosterShiftAction(id: string) {
  'use server'
  const supabase = await createClient()
  const payload = { status: 'deleted', deleted_at: new Date().toISOString(), updated_at: new Date().toISOString() }
  const { error } = await supabase.from(ROSTER_TABLES.assignments).update(payload).eq('id', id)
  if (error) throw new Error(error.message)
  await logHRActivity({ action: 'roster.shift.deleted', source_table: ROSTER_TABLES.assignments, record_id: id, entity_type: 'roster', entity_id: id, after: payload })
  revalidatePath('/hr/rosters')
  redirect('/hr/rosters')
}

export async function createRosterTemplateAction(formData: FormData) {
  'use server'
  const supabase = await createClient()
  const payload = {
    name: text(formData, 'name') || 'Shift template',
    shift_type: text(formData, 'shift_type') || 'standard',
    start_time: text(formData, 'start_time'),
    end_time: text(formData, 'end_time'),
    department: text(formData, 'department'),
    city: text(formData, 'city'),
    default_notes: text(formData, 'default_notes'),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }
  const { error } = await supabase.from(ROSTER_TABLES.templates).insert(payload)
  if (error) throw new Error(error.message)
  await logHRActivity({ action: 'roster.template.created', source_table: ROSTER_TABLES.templates, payload })
  revalidatePath('/hr/rosters/templates')
}

function addDays(date: Date, days: number) {
  const d = new Date(date); d.setDate(d.getDate() + days); return d
}

export function expandRepeatDates(start: string, rule: string | null, until: string | null) {
  if (!start) return []
  const begin = new Date(start)
  const end = until ? new Date(until) : begin
  const dates: string[] = []
  if (rule === 'monthly') {
    for (let d = new Date(begin), i = 0; d <= end && i < 12; i++) { dates.push(d.toISOString().slice(0,10)); d.setMonth(d.getMonth()+1) }
    return dates
  }
  const step = rule === 'weekly' ? 7 : rule === 'biweekly' ? 14 : 1
  for (let d = begin, i = 0; d <= end && i < 90; d = addDays(d, step), i++) dates.push(d.toISOString().slice(0,10))
  return dates
}

export async function createRepeatedRosterAction(formData: FormData) {
  'use server'
  const supabase = await createClient()
  const base = rosterPayload(formData)
  const rows = expandRepeatDates(String(base.work_date || ''), base.repeat_rule, base.repeat_until).map(work_date => ({ ...base, work_date, created_at: new Date().toISOString(), updated_at: new Date().toISOString() }))
  if (!rows.length) throw new Error('No repeat dates generated')
  const { error } = await supabase.from(ROSTER_TABLES.assignments).insert(rows)
  if (error) throw new Error(error.message)
  await logHRActivity({ action: 'roster.shift.repeated_created', source_table: ROSTER_TABLES.assignments, payload: { count: rows.length, base } })
  revalidatePath('/hr/rosters')
  redirect('/hr/rosters?view=month')
}
