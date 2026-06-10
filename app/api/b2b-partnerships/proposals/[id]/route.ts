import { NextRequest, NextResponse } from 'next/server'
import { B2B_AUDIT_ACTIONS } from '@/lib/b2b-partnerships/constants'
import { logB2BActivity, logB2BAuditEvent } from '@/lib/b2b-partnerships/audit'
import { requireB2BPermission } from '@/lib/b2b-partnerships/permissions'
import { getCurrentB2BAppUser, getServerB2BDatabaseClient } from '@/lib/b2b-partnerships/runtime'
import { PROPOSAL_STATUSES } from '@/lib/b2b-partnerships/completion-types'

function optionalString(value: unknown) { return typeof value === 'string' && value.trim() ? value.trim() : null }
function money(value: unknown) { const n = Number(value ?? 0); return Number.isFinite(n) && n >= 0 ? n : 0 }
function list(value: unknown) { return Array.isArray(value) ? value.filter((item) => typeof item === 'string' && item.trim()) : [] }

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const db = await getServerB2BDatabaseClient()
    const actor = await getCurrentB2BAppUser()
    if (!actor?.id) return NextResponse.json({ ok: false, error: 'Authentication required.' }, { status: 401 })

    const { data: existing } = await db.from('b2b_proposals').select('*').eq('id', params.id).single()
    if (!existing) return NextResponse.json({ ok: false, error: 'Proposal not found.' }, { status: 404 })

    const { data: prospect } = await db.from('b2b_prospects').select('assigned_owner_id,created_by').eq('id', existing.prospect_id).single()
    const permission = requireB2BPermission('update', {
      actorId: actor.id,
      actorRole: actor.role,
      assignedOwnerId: prospect?.assigned_owner_id,
      createdBy: prospect?.created_by,
    })
    if (!permission.ok) return NextResponse.json({ ok: false, error: permission.error }, { status: permission.status })

    const body = await req.json()
    const status = optionalString(body.status) ?? existing.status
    if (!PROPOSAL_STATUSES.includes(status as any)) return NextResponse.json({ ok: false, error: 'Invalid proposal status.' }, { status: 400 })

    const payload = {
      proposal_title: optionalString(body.proposal_title) ?? existing.proposal_title,
      proposal_type: optionalString(body.proposal_type),
      services_included: Array.isArray(body.services_included) ? list(body.services_included) : existing.services_included,
      pricing_model: optionalString(body.pricing_model),
      estimated_monthly_value: money(body.estimated_monthly_value ?? existing.estimated_monthly_value),
      estimated_annual_value: money(body.estimated_annual_value ?? existing.estimated_annual_value),
      pilot_duration: optionalString(body.pilot_duration),
      status,
      follow_up_at: optionalString(body.follow_up_at),
    }

    const { data, error } = await db.from('b2b_proposals').update(payload).eq('id', params.id).select('*').single()
    if (error) return NextResponse.json({ ok: false, error: 'Unable to update proposal.' }, { status: 500 })

    await logB2BActivity({ db, prospectId: data.prospect_id, actorId: actor.id, activityType: 'proposal.updated', title: 'B2B proposal updated', description: data.proposal_title })
    await logB2BAuditEvent({ db, actorId: actor.id, entityType: 'b2b_proposal', entityId: data.id, action: B2B_AUDIT_ACTIONS.PROPOSAL_UPDATED, beforeData: existing, afterData: data })

    return NextResponse.json({ ok: true, data })
  } catch {
    return NextResponse.json({ ok: false, error: 'Unexpected server error.' }, { status: 500 })
  }
}
