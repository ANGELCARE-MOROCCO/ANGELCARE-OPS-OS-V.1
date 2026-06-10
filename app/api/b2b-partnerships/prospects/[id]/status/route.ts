import { NextRequest, NextResponse } from 'next/server'
import { B2B_AUDIT_ACTIONS } from '@/lib/b2b-partnerships/constants'
import { logB2BActivity, logB2BAuditEvent } from '@/lib/b2b-partnerships/audit'
import { requireB2BPermission } from '@/lib/b2b-partnerships/permissions'
import { getCurrentB2BAppUser, getServerB2BDatabaseClient } from '@/lib/b2b-partnerships/runtime'
import {
  getStatusChangeActivityTitle,
  isSuccessStatus,
  validateStatusTransitionInput,
} from '@/lib/b2b-partnerships/status-transitions'
import type { B2BCrmStatus } from '@/lib/b2b-partnerships/types'
import { validateStatus } from '@/lib/b2b-partnerships/validation'

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const db = await getServerB2BDatabaseClient()
    const actor = await getCurrentB2BAppUser()

    if (!actor?.id) {
      return NextResponse.json({ ok: false, error: 'Authentication required.' }, { status: 401 })
    }

    const body = await req.json()
    const nextStatus = body.status

    if (!validateStatus(nextStatus)) {
      return NextResponse.json({ ok: false, error: 'Invalid status.' }, { status: 400 })
    }

    const reason = typeof body.reason === 'string' ? body.reason.trim() : null

    const { data: existing } = await db
      .from('b2b_prospects')
      .select('*')
      .eq('id', params.id)
      .is('archived_at', null)
      .single()

    if (!existing) {
      return NextResponse.json({ ok: false, error: 'Prospect not found.' }, { status: 404 })
    }

    const permission = requireB2BPermission('update', {
      actorId: actor.id,
      actorRole: actor.role,
      assignedOwnerId: existing.assigned_owner_id,
      createdBy: existing.created_by,
    })

    if (!permission.ok) {
      return NextResponse.json({ ok: false, error: permission.error }, { status: permission.status })
    }

    const currentStatus = existing.status as B2BCrmStatus
    const transition = validateStatusTransitionInput({ from: currentStatus, to: nextStatus, reason })

    if (!transition.ok) {
      return NextResponse.json({ ok: false, error: transition.error }, { status: 400 })
    }

    const updatePayload: Record<string, unknown> = { status: nextStatus, updated_by: actor.id }
    if (nextStatus === 'Lost') updatePayload.loss_reason = reason
    if (nextStatus === 'Not Fit') updatePayload.not_fit_reason = reason

    const { data, error } = await db
      .from('b2b_prospects')
      .update(updatePayload)
      .eq('id', params.id)
      .select('*')
      .single()

    if (error) {
      return NextResponse.json({ ok: false, error: 'Unable to update prospect status.' }, { status: 500 })
    }

    await logB2BActivity({
      db,
      prospectId: params.id,
      actorId: actor.id,
      activityType: 'prospect.status_changed',
      title: getStatusChangeActivityTitle(currentStatus, nextStatus),
      description: reason || null,
      metadata: { from: currentStatus, to: nextStatus, reason },
    })

    await logB2BAuditEvent({
      db,
      actorId: actor.id,
      entityType: 'b2b_prospect',
      entityId: params.id,
      action: B2B_AUDIT_ACTIONS.PROSPECT_STATUS_CHANGED,
      beforeData: existing,
      afterData: data,
      metadata: { reason },
    })

    if (isSuccessStatus(nextStatus)) {
      await logB2BActivity({
        db,
        prospectId: params.id,
        actorId: actor.id,
        activityType: 'prospect.success_stage',
        title: `Prospect moved to ${nextStatus}`,
        description: 'This prospect reached a strategic conversion stage.',
        metadata: { status: nextStatus },
      })
    }

    if (nextStatus === 'Signed Partner') {
      await db.from('b2b_tasks').insert({
        title: `Prepare onboarding for ${data.name}`,
        task_type: 'Internal validation',
        prospect_id: params.id,
        assigned_to: data.assigned_owner_id ?? actor.id,
        priority: 'High',
        status: 'To Do',
        description: 'Create onboarding checklist and operational launch plan for the signed B2B partner.',
        created_by: actor.id,
      })
    }

    return NextResponse.json({ ok: true, data })
  } catch (error) {
    console.error('[B2B_PROSPECT_STATUS_PATCH_FAILED]', error)
    return NextResponse.json({ ok: false, error: 'Unexpected server error.' }, { status: 500 })
  }
}
