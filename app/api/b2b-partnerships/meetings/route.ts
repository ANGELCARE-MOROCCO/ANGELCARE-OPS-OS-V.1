import { NextRequest, NextResponse } from 'next/server'
import { B2B_AUDIT_ACTIONS } from '@/lib/b2b-partnerships/constants'
import { logB2BActivity, logB2BAuditEvent } from '@/lib/b2b-partnerships/audit'
import { requireB2BPermission } from '@/lib/b2b-partnerships/permissions'
import { validateMeetingStatus } from '@/lib/b2b-partnerships/validation'
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

    const url = new URL(req.url)
    const prospectId = url.searchParams.get('prospect_id')
    const status = url.searchParams.get('status')
    let query = db
      .from('b2b_meetings')
      .select('*, prospect:b2b_prospects(id,name,sector,city,status,priority_score,next_follow_up_at)')
      .order('scheduled_at', { ascending: true })
    if (prospectId) query = query.eq('prospect_id', prospectId)
    if (status) query = query.eq('status', status)
    const { data, error } = await query
    if (error) return NextResponse.json({ ok: false, error: 'Unable to load meetings.' }, { status: 500 })
    return NextResponse.json({ ok: true, data: data ?? [] })
  } catch (error) {
    console.error('[B2B_MEETINGS_GET_FAILED]', error)
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
    const status = body.status ?? 'Scheduled'
    if (!validateMeetingStatus(status)) return NextResponse.json({ ok: false, error: 'Invalid meeting status.' }, { status: 400 })
    if (status === 'Scheduled' && !text(body.scheduled_at)) return NextResponse.json({ ok: false, error: 'scheduled_at is required for scheduled meetings.' }, { status: 400 })

    const { data: prospect } = await db.from('b2b_prospects').select('*').eq('id', prospectId).is('archived_at', null).single()
    if (!prospect) return NextResponse.json({ ok: false, error: 'Prospect not found.' }, { status: 404 })
    const permission = requireB2BPermission('update', { actorId: actor.id, actorRole: actor.role, assignedOwnerId: prospect.assigned_owner_id, createdBy: prospect.created_by })
    if (!permission.ok) return NextResponse.json({ ok: false, error: permission.error }, { status: permission.status })

    const payload = {
      prospect_id: prospectId,
      meeting_type: text(body.meeting_type) ?? 'Discovery meeting',
      status,
      scheduled_at: text(body.scheduled_at),
      location: text(body.location),
      video_link: text(body.video_link),
      agenda: text(body.agenda),
      notes: text(body.notes),
      needs_identified: text(body.needs_identified),
      objections: text(body.objections),
      decision_process: text(body.decision_process),
      budget_discussion: text(body.budget_discussion),
      next_step: text(body.next_step),
      follow_up_at: text(body.follow_up_at),
      created_by: actor.id,
      updated_by: actor.id,
    }

    const { data, error } = await db.from('b2b_meetings').insert(payload).select('*').single()
    if (error) return NextResponse.json({ ok: false, error: 'Unable to create meeting.' }, { status: 500 })

    const prospectUpdates: Record<string, unknown> = { status: status === 'Completed' ? 'Meeting Done' : 'Meeting Booked', updated_by: actor.id }
    if (payload.follow_up_at) prospectUpdates.next_follow_up_at = payload.follow_up_at
    if (payload.next_step) prospectUpdates.next_action = payload.next_step
    await db.from('b2b_prospects').update(prospectUpdates).eq('id', prospectId)

    await logB2BActivity({ db, prospectId, actorId: actor.id, activityType: 'meeting.created', title: `${payload.meeting_type} ${status}`, description: payload.agenda, metadata: { scheduled_at: payload.scheduled_at, follow_up_at: payload.follow_up_at } })
    await logB2BAuditEvent({ db, actorId: actor.id, entityType: 'b2b_meeting', entityId: data.id, action: B2B_AUDIT_ACTIONS.MEETING_CREATED, afterData: data })
    return NextResponse.json({ ok: true, data }, { status: 201 })
  } catch (error) {
    console.error('[B2B_MEETINGS_POST_FAILED]', error)
    return NextResponse.json({ ok: false, error: 'Unexpected server error.' }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const db = await getServerB2BDatabaseClient()
    const actor = await getCurrentB2BAppUser()
    if (!actor?.id) return NextResponse.json({ ok: false, error: 'Authentication required.' }, { status: 401 })
    const body = await req.json()
    const id = text(body.id)
    if (!id) return NextResponse.json({ ok: false, error: 'Meeting id is required.' }, { status: 400 })

    const { data: existing } = await db.from('b2b_meetings').select('*, prospect:b2b_prospects(*)').eq('id', id).single()
    if (!existing) return NextResponse.json({ ok: false, error: 'Meeting not found.' }, { status: 404 })
    const prospect = existing.prospect
    const permission = requireB2BPermission('update', { actorId: actor.id, actorRole: actor.role, assignedOwnerId: prospect?.assigned_owner_id, createdBy: prospect?.created_by })
    if (!permission.ok) return NextResponse.json({ ok: false, error: permission.error }, { status: permission.status })

    const status = body.status ?? existing.status
    if (!validateMeetingStatus(status)) return NextResponse.json({ ok: false, error: 'Invalid meeting status.' }, { status: 400 })

    const update = {
      meeting_type: text(body.meeting_type) ?? existing.meeting_type,
      status,
      scheduled_at: text(body.scheduled_at) ?? existing.scheduled_at,
      location: text(body.location),
      video_link: text(body.video_link),
      agenda: text(body.agenda),
      notes: text(body.notes),
      needs_identified: text(body.needs_identified),
      objections: text(body.objections),
      decision_process: text(body.decision_process),
      budget_discussion: text(body.budget_discussion),
      next_step: text(body.next_step),
      follow_up_at: text(body.follow_up_at),
      updated_by: actor.id,
    }
    const { data, error } = await db.from('b2b_meetings').update(update).eq('id', id).select('*').single()
    if (error) return NextResponse.json({ ok: false, error: 'Unable to update meeting.' }, { status: 500 })

    if (status === 'Completed') {
      await db.from('b2b_prospects').update({ status: 'Meeting Done', next_follow_up_at: update.follow_up_at, next_action: update.next_step, updated_by: actor.id }).eq('id', existing.prospect_id)
    }
    await logB2BActivity({ db, prospectId: existing.prospect_id, actorId: actor.id, activityType: status === 'Completed' ? 'meeting.completed' : 'meeting.updated', title: `Meeting ${status}`, description: update.notes, metadata: { follow_up_at: update.follow_up_at } })
    await logB2BAuditEvent({ db, actorId: actor.id, entityType: 'b2b_meeting', entityId: id, action: status === 'Completed' ? B2B_AUDIT_ACTIONS.MEETING_COMPLETED : B2B_AUDIT_ACTIONS.MEETING_UPDATED, beforeData: existing, afterData: data })

    return NextResponse.json({ ok: true, data })
  } catch (error) {
    console.error('[B2B_MEETINGS_PATCH_FAILED]', error)
    return NextResponse.json({ ok: false, error: 'Unexpected server error.' }, { status: 500 })
  }
}
