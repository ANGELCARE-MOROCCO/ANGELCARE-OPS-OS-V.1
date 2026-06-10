import { NextRequest, NextResponse } from 'next/server'
import { logB2BActivity, logB2BAuditEvent } from '@/lib/b2b-partnerships/audit'
import { B2B_AUDIT_ACTIONS } from '@/lib/b2b-partnerships/constants'
import { requireB2BPermission } from '@/lib/b2b-partnerships/permissions'
import { getCurrentB2BAppUser, getServerB2BDatabaseClient } from '@/lib/b2b-partnerships/runtime'

function clean(value: unknown) {
  return typeof value === 'string' && value.trim() ? value.trim() : null
}

export async function POST(req: NextRequest) {
  try {
    const db = await getServerB2BDatabaseClient()
    const actor = await getCurrentB2BAppUser()

    if (!actor?.id) {
      return NextResponse.json({ ok: false, error: 'Authentication required.' }, { status: 401 })
    }

    const body = (await req.json()) as Record<string, unknown>
    const prospectId = clean(body.prospect_id)
    const name = clean(body.name)

    if (!prospectId || !name) {
      return NextResponse.json({ ok: false, error: 'Prospect and contact name are required.' }, { status: 400 })
    }

    const { data: prospect } = await db
      .from('b2b_prospects')
      .select('id, assigned_owner_id, created_by, name')
      .eq('id', prospectId)
      .is('archived_at', null)
      .single()

    if (!prospect) {
      return NextResponse.json({ ok: false, error: 'Prospect not found.' }, { status: 404 })
    }

    const permission = requireB2BPermission('update', {
      actorId: actor.id,
      actorRole: actor.role,
      assignedOwnerId: prospect.assigned_owner_id,
      createdBy: prospect.created_by,
    })

    if (!permission.ok) {
      return NextResponse.json({ ok: false, error: permission.error }, { status: permission.status })
    }

    const payload = {
      prospect_id: prospectId,
      name,
      role: clean(body.role),
      phone: clean(body.phone),
      email: clean(body.email),
      linkedin: clean(body.linkedin),
      is_decision_maker: Boolean(body.is_decision_maker),
      influence_level: clean(body.influence_level),
      preferred_channel: clean(body.preferred_channel),
      notes: clean(body.notes),
      created_by: actor.id,
      updated_by: actor.id,
    }

    const { data, error } = await db.from('b2b_contacts').insert(payload).select('*').single()

    if (error) {
      return NextResponse.json({ ok: false, error: 'Unable to create contact.' }, { status: 500 })
    }

    if (payload.is_decision_maker) {
      await db
        .from('b2b_prospects')
        .update({
          decision_maker_name: payload.name,
          decision_maker_role: payload.role,
          decision_maker_phone: payload.phone,
          decision_maker_email: payload.email,
          updated_by: actor.id,
        })
        .eq('id', prospectId)
    }

    await logB2BActivity({
      db,
      prospectId,
      actorId: actor.id,
      activityType: 'contact.created',
      title: 'Contact B2B ajouté',
      description: `${data.name} a été ajouté au prospect ${prospect.name}.`,
      metadata: { contact_id: data.id, is_decision_maker: data.is_decision_maker },
    })

    await logB2BAuditEvent({
      db,
      actorId: actor.id,
      entityType: 'b2b_contact',
      entityId: data.id,
      action: B2B_AUDIT_ACTIONS.CONTACT_CREATED,
      afterData: data,
      metadata: { prospect_id: prospectId },
    })

    return NextResponse.json({ ok: true, data }, { status: 201 })
  } catch {
    return NextResponse.json({ ok: false, error: 'Unexpected server error.' }, { status: 500 })
  }
}
