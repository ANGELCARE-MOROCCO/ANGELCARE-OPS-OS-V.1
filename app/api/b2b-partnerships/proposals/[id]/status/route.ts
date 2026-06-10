import { NextRequest, NextResponse } from 'next/server'
import { B2B_AUDIT_ACTIONS } from '@/lib/b2b-partnerships/constants'
import { logB2BActivity, logB2BAuditEvent } from '@/lib/b2b-partnerships/audit'
import { requireB2BPermission } from '@/lib/b2b-partnerships/permissions'
import { getCurrentB2BAppUser, getServerB2BDatabaseClient } from '@/lib/b2b-partnerships/runtime'
import { PROPOSAL_STATUSES } from '@/lib/b2b-partnerships/completion-types'

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const db = await getServerB2BDatabaseClient()
    const actor = await getCurrentB2BAppUser()
    if (!actor?.id) return NextResponse.json({ ok: false, error: 'Authentication required.' }, { status: 401 })

    const body = await req.json()
    const status = typeof body.status === 'string' ? body.status : ''
    if (!PROPOSAL_STATUSES.includes(status as any)) return NextResponse.json({ ok: false, error: 'Invalid proposal status.' }, { status: 400 })

    const { data: existing } = await db.from('b2b_proposals').select('*').eq('id', params.id).single()
    if (!existing) return NextResponse.json({ ok: false, error: 'Proposal not found.' }, { status: 404 })

    const permissionAction = ['Approved', 'Sent', 'Accepted'].includes(status) ? 'approve_proposal' : 'update'
    const permission = requireB2BPermission(permissionAction as any, { actorId: actor.id, actorRole: actor.role })
    if (!permission.ok) return NextResponse.json({ ok: false, error: permission.error }, { status: permission.status })

    const patch: Record<string, unknown> = { status }
    if (status === 'Approved') patch.approved_by = actor.id
    if (status === 'Sent') patch.sent_at = new Date().toISOString()

    const { data, error } = await db.from('b2b_proposals').update(patch).eq('id', params.id).select('*').single()
    if (error) return NextResponse.json({ ok: false, error: 'Unable to update proposal status.' }, { status: 500 })

    await logB2BActivity({ db, prospectId: data.prospect_id, actorId: actor.id, activityType: 'proposal.status_changed', title: `Proposal moved to ${status}`, description: data.proposal_title, metadata: { from: existing.status, to: status } })
    await logB2BAuditEvent({ db, actorId: actor.id, entityType: 'b2b_proposal', entityId: data.id, action: status === 'Sent' ? B2B_AUDIT_ACTIONS.PROPOSAL_SENT : status === 'Approved' ? B2B_AUDIT_ACTIONS.PROPOSAL_APPROVED : B2B_AUDIT_ACTIONS.PROPOSAL_UPDATED, beforeData: existing, afterData: data })

    if (status === 'Accepted') {
      await db.from('b2b_prospects').update({ status: 'Signed Partner', updated_by: actor.id }).eq('id', data.prospect_id)
      await db.from('b2b_tasks').insert({ title: `Launch partner onboarding for accepted proposal: ${data.proposal_title}`, task_type: 'Internal validation', prospect_id: data.prospect_id, assigned_to: actor.id, priority: 'High', status: 'To Do', description: 'Accepted proposal requires onboarding, operational validation, and launch planning.', created_by: actor.id })
    }

    return NextResponse.json({ ok: true, data })
  } catch {
    return NextResponse.json({ ok: false, error: 'Unexpected server error.' }, { status: 500 })
  }
}
