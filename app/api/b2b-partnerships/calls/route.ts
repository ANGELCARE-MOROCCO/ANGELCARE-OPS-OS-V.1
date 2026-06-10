import { NextRequest, NextResponse } from 'next/server'
import { B2B_AUDIT_ACTIONS } from '@/lib/b2b-partnerships/constants'
import { logB2BActivity, logB2BAuditEvent } from '@/lib/b2b-partnerships/audit'
import { requireB2BPermission } from '@/lib/b2b-partnerships/permissions'
import { getCurrentB2BAppUser, getServerB2BDatabaseClient } from '@/lib/b2b-partnerships/runtime'

function text(value: unknown): string | null {
  return typeof value === 'string' && value.trim() ? value.trim() : null
}

export async function GET(req: NextRequest) {
  try {
    const db = await getServerB2BDatabaseClient()
    const actor = await getCurrentB2BAppUser()
    if (!actor?.id) return NextResponse.json({ ok: false, error: 'Authentication required.' }, { status: 401 })
    const permission = requireB2BPermission('read', { actorId: actor.id, actorRole: actor.role })
    if (!permission.ok) return NextResponse.json({ ok: false, error: permission.error }, { status: permission.status })

    const prospectId = new URL(req.url).searchParams.get('prospect_id')
    let query = db
      .from('b2b_calls')
      .select('*, prospect:b2b_prospects(id,name,sector,city,status,priority_score,next_follow_up_at), contact:b2b_contacts(id,name,role,email,phone,preferred_channel,is_decision_maker)')
      .order('created_at', { ascending: false })
    if (prospectId) query = query.eq('prospect_id', prospectId)
    const { data, error } = await query
    if (error) return NextResponse.json({ ok: false, error: 'Unable to load calls.' }, { status: 500 })
    return NextResponse.json({ ok: true, data: data ?? [] })
  } catch (error) {
    console.error('[B2B_CALLS_GET_FAILED]', error)
    return NextResponse.json({ ok: false, error: 'Unexpected server error.' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const db = await getServerB2BDatabaseClient()
    const actor = await getCurrentB2BAppUser()
    if (!actor?.id) return NextResponse.json({ ok: false, error: 'Authentication required.' }, { status: 401 })
    const body = await req.json()
    const prospectId = text(body.prospect_id)
    if (!prospectId) return NextResponse.json({ ok: false, error: 'prospect_id is required.' }, { status: 400 })

    const { data: prospect } = await db.from('b2b_prospects').select('*').eq('id', prospectId).is('archived_at', null).single()
    if (!prospect) return NextResponse.json({ ok: false, error: 'Prospect not found.' }, { status: 404 })
    const permission = requireB2BPermission('update', { actorId: actor.id, actorRole: actor.role, assignedOwnerId: prospect.assigned_owner_id, createdBy: prospect.created_by })
    if (!permission.ok) return NextResponse.json({ ok: false, error: permission.error }, { status: permission.status })

    const duration = Number(body.duration_minutes ?? 0)
    const payload = {
      prospect_id: prospectId,
      contact_id: text(body.contact_id),
      caller_id: actor.id,
      call_type: text(body.call_type) ?? 'First call',
      call_result: text(body.call_result) ?? 'No answer',
      duration_minutes: Number.isFinite(duration) && duration >= 0 ? duration : 0,
      summary: text(body.summary),
      objections: text(body.objections),
      decision_maker_identified: Boolean(body.decision_maker_identified),
      next_step: text(body.next_step),
      next_follow_up_at: text(body.next_follow_up_at),
    }

    const { data, error } = await db.from('b2b_calls').insert(payload).select('*').single()
    if (error) return NextResponse.json({ ok: false, error: 'Unable to log call.' }, { status: 500 })

    const updates: Record<string, unknown> = { last_contact_at: new Date().toISOString(), updated_by: actor.id }
    if (payload.next_follow_up_at) updates.next_follow_up_at = payload.next_follow_up_at
    if (payload.next_step) updates.next_action = payload.next_step
    if (['Interested', 'Meeting booked', 'Decision maker reached'].includes(payload.call_result ?? '')) updates.status = payload.call_result === 'Meeting booked' ? 'Meeting Booked' : 'Interested'
    await db.from('b2b_prospects').update(updates).eq('id', prospectId)

    await logB2BActivity({ db, prospectId, actorId: actor.id, activityType: 'call.logged', title: `Call logged: ${payload.call_result}`, description: payload.summary, metadata: { call_type: payload.call_type, next_follow_up_at: payload.next_follow_up_at } })
    await logB2BAuditEvent({ db, actorId: actor.id, entityType: 'b2b_call', entityId: data.id, action: B2B_AUDIT_ACTIONS.CALL_LOGGED, afterData: data })

    return NextResponse.json({ ok: true, data }, { status: 201 })
  } catch (error) {
    console.error('[B2B_CALLS_POST_FAILED]', error)
    return NextResponse.json({ ok: false, error: 'Unexpected server error.' }, { status: 500 })
  }
}
