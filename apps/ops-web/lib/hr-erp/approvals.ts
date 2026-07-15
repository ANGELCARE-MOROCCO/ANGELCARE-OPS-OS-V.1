import { createClient } from '@/lib/supabase/server'
import { writeHRAudit } from './audit'
export async function createHRApproval(input: { requestType: string; entityType?: string; entityId?: string; requesterId?: string; payload?: any; priority?: string }) {
  const supabase = await createClient()
  const { data, error } = await supabase.from('hr_approvals').insert({
    request_type: input.requestType, entity_type: input.entityType || null, entity_id: input.entityId || null,
    requester_id: input.requesterId || null, priority: input.priority || 'normal', payload: input.payload || {}, status: 'pending'
  }).select('*').single()
  if (error) throw new Error(error.message)
  await writeHRAudit('approval.created', { entityType: 'hr_approval', entityId: data.id, after: data })
  return data
}
export async function decideHRApproval(id: string, status: 'approved'|'rejected', note?: string, approverId?: string) {
  const supabase = await createClient()
  const { data, error } = await supabase.from('hr_approvals').update({ status, decision_note: note || null, approver_id: approverId || null, decided_at: new Date().toISOString() }).eq('id', id).select('*').single()
  if (error) throw new Error(error.message)
  await writeHRAudit(`approval.${status}`, { entityType: 'hr_approval', entityId: id, after: data })
  return data
}
