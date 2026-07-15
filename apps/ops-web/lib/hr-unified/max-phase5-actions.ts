'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { getCurrentUser } from '@/lib/getUser'

function s(fd: FormData, k: string, f='') { return String(fd.get(k) || f) }
function n(fd: FormData, k: string, f=0) { const v = Number(fd.get(k)); return Number.isFinite(v) ? v : f }
function nullable(fd: FormData, k: string) { const v = String(fd.get(k) || '').trim(); return v || null }

async function audit(action: string, entity_type: string, entity_id?: string | null, metadata: Record<string, any> = {}) {
  const supabase = await createClient()
  const user = await getCurrentUser()
  await supabase.from('hr_audit_logs').insert([{ actor_id: user?.id || null, action, entity_type, entity_id: entity_id || null, metadata }])
}

export async function createPlaybookPhase5(fd: FormData) {
  const supabase = await createClient()
  const payload = {
    title:s(fd,'title'), category:s(fd,'category','general'), owner:s(fd,'owner'),
    status:s(fd,'status','active'), priority:s(fd,'priority','medium'),
    summary:s(fd,'summary'), steps:s(fd,'steps'), notes:s(fd,'notes')
  }
  const { error } = await supabase.from('hr_playbooks').insert([payload])
  if (error) throw new Error(error.message)
  await audit('create_playbook_phase5','hr_playbooks',null,payload)
  revalidatePath('/hr/playbooks')
}

export async function createTemplatePhase5(fd: FormData) {
  const supabase = await createClient()
  const payload = {
    title:s(fd,'title'), template_type:s(fd,'template_type','message'), status:s(fd,'status','active'),
    audience:s(fd,'audience','hr'), body:s(fd,'body'), notes:s(fd,'notes')
  }
  const { error } = await supabase.from('hr_templates').insert([payload])
  if (error) throw new Error(error.message)
  await audit('create_template_phase5','hr_templates',null,payload)
  revalidatePath('/hr/templates')
}

export async function createBulkActionPhase5(fd: FormData) {
  const supabase = await createClient()
  const payload = {
    title:s(fd,'title'), action_type:s(fd,'action_type','review'), target_area:s(fd,'target_area','staff'),
    status:s(fd,'status','queued'), priority:s(fd,'priority','medium'), criteria:s(fd,'criteria'), notes:s(fd,'notes')
  }
  const { error } = await supabase.from('hr_bulk_actions').insert([payload])
  if (error) throw new Error(error.message)
  await audit('create_bulk_action_phase5','hr_bulk_actions',null,payload)
  revalidatePath('/hr/bulk-actions')
}

export async function createQualityReviewPhase5(fd: FormData) {
  const supabase = await createClient()
  const payload = {
    title:s(fd,'title'), review_type:s(fd,'review_type','profile_quality'), entity_type:s(fd,'entity_type','hr'),
    entity_id:nullable(fd,'entity_id'), score:n(fd,'score',0), status:s(fd,'status','open'),
    findings:s(fd,'findings'), action_plan:s(fd,'action_plan'), notes:s(fd,'notes')
  }
  const { error } = await supabase.from('hr_quality_reviews').insert([payload])
  if (error) throw new Error(error.message)
  await audit('create_quality_review_phase5','hr_quality_reviews',null,payload)
  revalidatePath('/hr/quality')
}

export async function createCalendarEventPhase5(fd: FormData) {
  const supabase = await createClient()
  const payload = {
    title:s(fd,'title'), event_type:s(fd,'event_type','hr_event'), event_at:nullable(fd,'event_at'),
    owner:s(fd,'owner'), status:s(fd,'status','planned'), location:s(fd,'location'), notes:s(fd,'notes')
  }
  const { error } = await supabase.from('hr_calendar_events').insert([payload])
  if (error) throw new Error(error.message)
  await audit('create_calendar_event_phase5','hr_calendar_events',null,payload)
  revalidatePath('/hr/calendar')
}

export async function createEscalationPhase5(fd: FormData) {
  const supabase = await createClient()
  const payload = {
    title:s(fd,'title'), escalation_type:s(fd,'escalation_type','operational'), severity:s(fd,'severity','medium'),
    status:s(fd,'status','open'), owner:s(fd,'owner'), related_entity_type:s(fd,'related_entity_type','hr'),
    related_entity_id:nullable(fd,'related_entity_id'), issue:s(fd,'issue'), resolution_plan:s(fd,'resolution_plan'), notes:s(fd,'notes')
  }
  const { error } = await supabase.from('hr_escalations').insert([payload])
  if (error) throw new Error(error.message)
  await audit('create_escalation_phase5','hr_escalations',null,payload)
  revalidatePath('/hr/escalations')
}

export async function updatePhase5Status(fd: FormData) {
  const supabase = await createClient()
  const table = s(fd,'table')
  const id = s(fd,'id')
  const status = s(fd,'status')
  const returnPath = s(fd,'returnPath','/hr')
  const { error } = await supabase.from(table).update({ status, updated_at:new Date().toISOString() }).eq('id', id)
  if (error) throw new Error(error.message)
  await audit('update_phase5_status',table,id,{status})
  revalidatePath(returnPath)
}
