'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getCurrentUser } from '@/lib/getUser'

function s(fd: FormData, key: string, fallback='') { return String(fd.get(key) || fallback) }
function n(fd: FormData, key: string, fallback=0) { const v = Number(fd.get(key)); return Number.isFinite(v) ? v : fallback }
function nullable(fd: FormData, key: string) { const v = String(fd.get(key) || '').trim(); return v || null }

async function audit(action: string, entity_type: string, entity_id?: string | null, metadata: Record<string, any> = {}) {
  const supabase = await createClient()
  const user = await getCurrentUser()
  await supabase.from('hr_audit_logs').insert([{ actor_id: user?.id || null, action, entity_type, entity_id: entity_id || null, metadata }])
}

export async function createCandidateMax(fd: FormData) {
  const supabase = await createClient()
  const payload = {
    opening_id: nullable(fd,'opening_id'),
    full_name: s(fd,'full_name'),
    phone: s(fd,'phone'),
    email: s(fd,'email'),
    city: s(fd,'city'),
    source: s(fd,'source','manual'),
    stage: s(fd,'stage','new'),
    status: s(fd,'status','active'),
    rating: n(fd,'rating',0),
    availability: s(fd,'availability'),
    expected_salary: n(fd,'expected_salary',0),
    next_action: s(fd,'next_action'),
    notes: s(fd,'notes'),
  }
  const { data, error } = await supabase.from('hr_recruitment_candidates').insert([payload]).select('id').single()
  if (error) throw new Error(error.message)
  await supabase.from('hr_recruitment_pipeline').insert([{ candidate_id:data.id, stage:payload.stage, status:'active', decision:'Candidate created' }])
  await audit('create_candidate_max','hr_recruitment_candidates',data.id,payload)
  revalidatePath('/hr/recruitment')
  redirect(`/hr/recruitment/candidates/${data.id}`)
}

export async function moveCandidateMax(fd: FormData) {
  const supabase = await createClient()
  const id = s(fd,'id')
  const stage = s(fd,'stage','screening')
  const status = s(fd,'status','active')
  const { error } = await supabase.from('hr_recruitment_candidates').update({ stage, status, updated_at:new Date().toISOString() }).eq('id', id)
  if (error) throw new Error(error.message)
  await supabase.from('hr_recruitment_pipeline').insert([{ candidate_id:id, stage, status, decision:`Moved to ${stage}` }])
  await audit('move_candidate_max','hr_recruitment_candidates',id,{stage,status})
  revalidatePath('/hr/recruitment')
  revalidatePath('/hr/recruitment/kanban')
  revalidatePath(`/hr/recruitment/candidates/${id}`)
}

export async function createHRTaskMax(fd: FormData) {
  const supabase = await createClient()
  const payload = {
    title: s(fd,'title'),
    task_type: s(fd,'task_type','general'),
    module_area: s(fd,'module_area','hr'),
    priority: s(fd,'priority','medium'),
    stage: s(fd,'stage','open'),
    status: s(fd,'status','open'),
    related_candidate_id: nullable(fd,'related_candidate_id'),
    related_staff_id: nullable(fd,'related_staff_id'),
    related_opening_id: nullable(fd,'related_opening_id'),
    due_at: nullable(fd,'due_at'),
    description: s(fd,'description'),
    notes: s(fd,'notes'),
  }
  const { data, error } = await supabase.from('hr_execution_tasks').insert([payload]).select('id').single()
  if (error) throw new Error(error.message)
  await audit('create_hr_task_max','hr_execution_tasks',data?.id,payload)
  revalidatePath('/hr')
  revalidatePath('/hr/tasks')
}

export async function updateHRTaskStatusMax(fd: FormData) {
  const supabase = await createClient()
  const id = s(fd,'id')
  const status = s(fd,'status','completed')
  const { error } = await supabase.from('hr_execution_tasks').update({
    status,
    stage: status,
    completed_at: status === 'completed' ? new Date().toISOString() : null,
    updated_at: new Date().toISOString()
  }).eq('id', id)
  if (error) throw new Error(error.message)
  await audit('update_task_status_max','hr_execution_tasks',id,{status})
  revalidatePath('/hr/tasks')
  revalidatePath('/hr')
}

export async function createApprovalMax(fd: FormData) {
  const supabase = await createClient()
  const payload = {
    title: s(fd,'title'),
    approval_type: s(fd,'approval_type','general'),
    entity_type: s(fd,'entity_type','hr'),
    priority: s(fd,'priority','medium'),
    status: s(fd,'status','pending'),
    requested_reason: s(fd,'requested_reason'),
    notes: s(fd,'notes'),
  }
  const { data, error } = await supabase.from('hr_approval_requests').insert([payload]).select('id').single()
  if (error) throw new Error(error.message)
  await audit('create_approval_max','hr_approval_requests',data?.id,payload)
  revalidatePath('/hr/approvals')
}

export async function decideApprovalMax(fd: FormData) {
  const supabase = await createClient()
  const user = await getCurrentUser()
  const id = s(fd,'id')
  const status = s(fd,'status','approved')
  const decision_notes = s(fd,'decision_notes')
  const { error } = await supabase.from('hr_approval_requests').update({
    status,
    decision_notes,
    decided_by: user?.id || null,
    decided_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }).eq('id', id)
  if (error) throw new Error(error.message)
  await audit('decide_approval_max','hr_approval_requests',id,{status,decision_notes})
  revalidatePath('/hr/approvals')
  revalidatePath('/hr')
}
