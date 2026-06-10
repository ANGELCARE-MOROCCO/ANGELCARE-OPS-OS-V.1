import { NextRequest, NextResponse } from 'next/server'
import { B2B_AUDIT_ACTIONS } from '@/lib/b2b-partnerships/constants'
import { logB2BActivity, logB2BAuditEvent } from '@/lib/b2b-partnerships/audit'
import { requireB2BPermission } from '@/lib/b2b-partnerships/permissions'
import { validateOutreachChannel, validateOutreachOutcome } from '@/lib/b2b-partnerships/validation'
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
    const channel = url.searchParams.get('channel')
    const outcome = url.searchParams.get('outcome')

    let query = db
      .from('b2b_outreach_logs')
      .select('*, prospect:b2b_prospects(id,name,sector,city,status,priority_score,next_follow_up_at), contact:b2b_contacts(id,name,role,email,phone,preferred_channel,is_decision_maker)')
      .order('sent_at', { ascending: false })

    if (prospectId) query = query.eq('prospect_id', prospectId)
    if (channel) query = query.eq('channel', channel)
    if (outcome) query = query.eq('outcome', outcome)

    const { data, error } = await query
    if (error) return NextResponse.json({ ok: false, error: 'Unable to load outreach logs.' }, { status: 500 })
    return NextResponse.json({ ok: true, data: data ?? [] })
  } catch (error) {
    console.error('[B2B_OUTREACH_GET_FAILED]', error)
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

    const permission = requireB2BPermission('update', {
      actorId: actor.id,
      actorRole: actor.role,
      assignedOwnerId: prospect.assigned_owner_id,
      createdBy: prospect.created_by,
    })
    if (!permission.ok) return NextResponse.json({ ok: false, error: permission.error }, { status: permission.status })

    if (!validateOutreachChannel(body.channel)) return NextResponse.json({ ok: false, error: 'Invalid outreach channel.' }, { status: 400 })
    const outcome = body.outcome ?? 'No response'
    if (!validateOutreachOutcome(outcome)) return NextResponse.json({ ok: false, error: 'Invalid outreach outcome.' }, { status: 400 })

    const payload = {
      prospect_id: prospectId,
      contact_id: text(body.contact_id),
      channel: body.channel,
      template_key: text(body.template_key),
      subject: text(body.subject),
      message_body: text(body.message_body),
      outcome,
      sent_by: actor.id,
      sent_at: text(body.sent_at) ?? new Date().toISOString(),
      next_follow_up_at: text(body.next_follow_up_at),
    }

    const { data, error } = await db.from('b2b_outreach_logs').insert(payload).select('*').single()
    if (error) return NextResponse.json({ ok: false, error: 'Unable to log outreach.' }, { status: 500 })

    const nextUpdates: Record<string, unknown> = { last_contact_at: payload.sent_at, updated_by: actor.id }
    if (payload.next_follow_up_at) nextUpdates.next_follow_up_at = payload.next_follow_up_at
    if (body.next_action) nextUpdates.next_action = text(body.next_action)
    if (outcome === 'Positive reply' || outcome === 'Meeting booked') nextUpdates.status = outcome === 'Meeting booked' ? 'Meeting Booked' : 'Interested'
    await db.from('b2b_prospects').update(nextUpdates).eq('id', prospectId)

    await logB2BActivity({
      db,
      prospectId,
      actorId: actor.id,
      activityType: 'outreach.logged',
      title: `${payload.channel} outreach logged`,
      description: payload.subject,
      metadata: { outcome, template_key: payload.template_key, next_follow_up_at: payload.next_follow_up_at },
    })
    await logB2BAuditEvent({ db, actorId: actor.id, entityType: 'b2b_outreach_log', entityId: data.id, action: B2B_AUDIT_ACTIONS.OUTREACH_LOGGED, afterData: data })

    return NextResponse.json({ ok: true, data }, { status: 201 })
  } catch (error) {
    console.error('[B2B_OUTREACH_POST_FAILED]', error)
    return NextResponse.json({ ok: false, error: 'Unexpected server error.' }, { status: 500 })
  }
}
