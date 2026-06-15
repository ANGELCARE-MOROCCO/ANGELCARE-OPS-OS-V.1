'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

type ActionResult = { ok: boolean; data?: any; error?: string }
const PATH = '/hr/onboarding'

function revalidateOnboardingSurface() {
  revalidatePath('/hr/onboarding')
  revalidatePath('/hr')
  revalidatePath('/hr/employees')
  revalidatePath('/hr/staff')
  revalidatePath('/hr/recruitment')
  revalidatePath('/hr/recruitment/candidates')
  revalidatePath('/hr/documents')
  revalidatePath('/hr/training')
}

async function db() { return createClient() }

async function insertAny(tables: string[], payload: Record<string, any>): Promise<ActionResult> {
  const supabase = await db()
  let last = ''
  for (const table of tables) {
    try {
      const { data, error } = await supabase.from(table).insert(payload).select('*').single()
      if (!error) { revalidateOnboardingSurface(); return { ok: true, data } }
      last = error.message
    } catch (e: any) { last = e?.message || 'Insert failed' }
  }
  return { ok: false, error: last || 'No onboarding table accepted the insert' }
}

async function updateAny(tables: string[], id: string, payload: Record<string, any>): Promise<ActionResult> {
  const supabase = await db()
  let last = ''
  for (const table of tables) {
    try {
      const { data, error } = await supabase.from(table).update(payload).eq('id', id).select('*').maybeSingle()
      if (!error) { revalidateOnboardingSurface(); return { ok: true, data } }
      last = error.message
    } catch (e: any) { last = e?.message || 'Update failed' }
  }
  return { ok: false, error: last || 'No onboarding table accepted the update' }
}

async function deleteAny(tables: string[], id: string): Promise<ActionResult> {
  const supabase = await db()
  let last = ''
  for (const table of tables) {
    try {
      const { error } = await supabase.from(table).delete().eq('id', id)
      if (!error) { revalidateOnboardingSurface(); return { ok: true } }
      last = error.message
    } catch (e: any) { last = e?.message || 'Delete failed' }
  }
  return { ok: false, error: last || 'No onboarding table accepted the delete' }
}

const JOURNEY_TABLES = ['hr_onboarding_journeys', 'onboarding_journeys', 'employee_onboarding']
const TASK_TABLES = ['hr_onboarding_tasks', 'onboarding_tasks', 'employee_onboarding_tasks']
const DOC_TABLES = ['hr_onboarding_documents', 'onboarding_documents', 'employee_documents']
const ACTIVITY_TABLES = ['hr_onboarding_activity', 'onboarding_activity', 'activity_logs']

export async function createOnboardingJourney(payload: Record<string, any>) {
  return insertAny(JOURNEY_TABLES, { ...payload, status: payload.status || 'In Progress', progress: payload.progress ?? 0, created_at: payload.created_at || new Date().toISOString() })
}
export async function updateOnboardingJourney(id: string, payload: Record<string, any>) { return updateAny(JOURNEY_TABLES, id, { ...payload, updated_at: new Date().toISOString() }) }
export async function deleteOnboardingJourney(id: string) { return deleteAny(JOURNEY_TABLES, id) }

export async function createOnboardingTask(payload: Record<string, any>) {
  return insertAny(TASK_TABLES, { ...payload, status: payload.status || 'Pending', created_at: payload.created_at || new Date().toISOString() })
}
export async function updateOnboardingTask(id: string, payload: Record<string, any>) { return updateAny(TASK_TABLES, id, { ...payload, updated_at: new Date().toISOString() }) }
export async function deleteOnboardingTask(id: string) { return deleteAny(TASK_TABLES, id) }

export async function createOnboardingDocument(payload: Record<string, any>) { return insertAny(DOC_TABLES, { ...payload, status: payload.status || 'Required', created_at: payload.created_at || new Date().toISOString() }) }
export async function updateOnboardingDocument(id: string, payload: Record<string, any>) { return updateAny(DOC_TABLES, id, { ...payload, updated_at: new Date().toISOString() }) }
export async function deleteOnboardingDocument(id: string) { return deleteAny(DOC_TABLES, id) }

export async function addOnboardingNote(payload: Record<string, any>) { return insertAny(ACTIVITY_TABLES, { ...payload, type: payload.type || 'note', created_at: new Date().toISOString() }) }
export async function createOnboardingReminder(payload: Record<string, any>) { return insertAny(ACTIVITY_TABLES, { ...payload, type: 'reminder', title: payload.title || 'Reminder WhatsApp', created_at: new Date().toISOString() }) }
export async function reassignOnboardingOwner(id: string, owner: string) { return updateAny(JOURNEY_TABLES, id, { owner, owner_name: owner, updated_at: new Date().toISOString() }) }
