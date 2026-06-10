import { NextRequest, NextResponse } from 'next/server'
import { B2B_AUDIT_ACTIONS } from '@/lib/b2b-partnerships/constants'
import { logB2BAuditEvent, logB2BActivity } from '@/lib/b2b-partnerships/audit'
import { requireB2BPermission } from '@/lib/b2b-partnerships/permissions'
import { getCurrentB2BAppUser, getServerB2BDatabaseClient } from '@/lib/b2b-partnerships/runtime'
import { validateProspectPayload } from '@/lib/b2b-partnerships/validation'

export async function GET(_: NextRequest, { params }: { params: { id: string } }) {
  try {
    const db = await getServerB2BDatabaseClient()
    const actor = await getCurrentB2BAppUser()

    if (!actor?.id) {
      return NextResponse.json({ ok: false, error: 'Authentication required.' }, { status: 401 })
    }

    const permission = requireB2BPermission('read', {
      actorId: actor.id,
      actorRole: actor.role,
    })

    if (!permission.ok) {
      return NextResponse.json({ ok: false, error: permission.error }, { status: permission.status })
    }

    const { data: prospect, error } = await db
      .from('b2b_prospects')
      .select('*')
      .eq('id', params.id)
      .is('archived_at', null)
      .single()

    if (error || !prospect) {
      return NextResponse.json({ ok: false, error: 'Prospect not found.' }, { status: 404 })
    }

    const [contacts, activities, outreach, calls, meetings, proposals, tasks] = await Promise.all([
      db.from('b2b_contacts').select('*').eq('prospect_id', params.id).is('archived_at', null).order('created_at', { ascending: false }),
      db.from('b2b_activities').select('*').eq('prospect_id', params.id).order('created_at', { ascending: false }),
      db.from('b2b_outreach_logs').select('*').eq('prospect_id', params.id).order('created_at', { ascending: false }),
      db.from('b2b_calls').select('*').eq('prospect_id', params.id).order('created_at', { ascending: false }),
      db.from('b2b_meetings').select('*').eq('prospect_id', params.id).order('scheduled_at', { ascending: false }),
      db.from('b2b_proposals').select('*').eq('prospect_id', params.id).order('created_at', { ascending: false }),
      db.from('b2b_tasks').select('*').eq('prospect_id', params.id).order('created_at', { ascending: false }),
    ])

    return NextResponse.json({
      ok: true,
      data: {
        prospect,
        contacts: contacts.data ?? [],
        activities: activities.data ?? [],
        outreach: outreach.data ?? [],
        calls: calls.data ?? [],
        meetings: meetings.data ?? [],
        proposals: proposals.data ?? [],
        tasks: tasks.data ?? [],
      },
    })
  } catch (error) {
    console.error('[B2B_PROSPECT_GET_FAILED]', error)
    return NextResponse.json({ ok: false, error: 'Unexpected server error.' }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const db = await getServerB2BDatabaseClient()
    const actor = await getCurrentB2BAppUser()

    if (!actor?.id) {
      return NextResponse.json({ ok: false, error: 'Authentication required.' }, { status: 401 })
    }

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

    const body = await req.json()
    const validated = validateProspectPayload({ ...existing, ...body })

    if (!validated.ok) {
      return NextResponse.json({ ok: false, error: validated.error }, { status: 400 })
    }

    const { data, error } = await db
      .from('b2b_prospects')
      .update({ ...validated.value, updated_by: actor.id })
      .eq('id', params.id)
      .select('*')
      .single()

    if (error) {
      return NextResponse.json({ ok: false, error: 'Unable to update prospect.' }, { status: 500 })
    }

    await logB2BActivity({
      db,
      prospectId: params.id,
      actorId: actor.id,
      activityType: 'prospect.updated',
      title: 'B2B prospect updated',
      description: `Prospect ${data.name} was updated.`,
    })

    await logB2BAuditEvent({
      db,
      actorId: actor.id,
      entityType: 'b2b_prospect',
      entityId: params.id,
      action: B2B_AUDIT_ACTIONS.PROSPECT_UPDATED,
      beforeData: existing,
      afterData: data,
    })

    return NextResponse.json({ ok: true, data })
  } catch (error) {
    console.error('[B2B_PROSPECT_PATCH_FAILED]', error)
    return NextResponse.json({ ok: false, error: 'Unexpected server error.' }, { status: 500 })
  }
}
