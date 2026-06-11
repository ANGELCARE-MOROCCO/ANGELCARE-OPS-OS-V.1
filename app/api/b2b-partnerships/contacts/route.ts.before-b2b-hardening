import { NextRequest, NextResponse } from 'next/server'
import { getCurrentB2BAppUser, getServerB2BDatabaseClient } from '@/lib/b2b-partnerships/runtime'
import { requireB2BPermission } from '@/lib/b2b-partnerships/permissions'

export async function POST(req: NextRequest) {
  try {
    const db = await getServerB2BDatabaseClient()
    const actor = await getCurrentB2BAppUser()
    if (!actor?.id) return NextResponse.json({ ok: false, error: 'Authentication required.' }, { status: 401 })

    const body = await req.json()
    if (!body?.prospect_id || !body?.name) return NextResponse.json({ ok: false, error: 'Prospect and contact name are required.' }, { status: 400 })

    const { data: prospect } = await db.from('b2b_prospects').select('id,assigned_owner_id,created_by,name').eq('id', body.prospect_id).is('archived_at', null).single()
    if (!prospect) return NextResponse.json({ ok: false, error: 'Prospect not found.' }, { status: 404 })

    const permission = requireB2BPermission('update', { actorId: actor.id, actorRole: actor.role || actor.role_key, assignedOwnerId: prospect.assigned_owner_id, createdBy: prospect.created_by })
    if (!permission.ok) return NextResponse.json({ ok: false, error: permission.error }, { status: permission.status })

    const payload = {
      prospect_id: body.prospect_id,
      name: String(body.name).trim(),
      role: body.role || null,
      phone: body.phone || null,
      email: body.email || null,
      linkedin: body.linkedin || null,
      is_decision_maker: Boolean(body.is_decision_maker),
      influence_level: body.influence_level || null,
      preferred_channel: body.preferred_channel || null,
      notes: body.notes || null,
      created_by: actor.id,
      updated_by: actor.id,
    }

    const { data, error } = await db.from('b2b_contacts').insert(payload).select('*').single()
    if (error) return NextResponse.json({ ok: false, error: 'Unable to create contact.' }, { status: 500 })

    if (payload.is_decision_maker) {
      await db.from('b2b_prospects').update({ decision_maker_name: payload.name, decision_maker_role: payload.role, decision_maker_email: payload.email, decision_maker_phone: payload.phone, updated_by: actor.id }).eq('id', body.prospect_id)
    }

    await db.from('b2b_activities').insert({ prospect_id: body.prospect_id, actor_id: actor.id, activity_type: 'contact.created', title: `Contact added: ${payload.name}`, description: payload.role, metadata: { is_decision_maker: payload.is_decision_maker } })
    await db.from('b2b_audit_events').insert({ actor_id: actor.id, entity_type: 'b2b_contact', entity_id: data.id, action: 'b2b.contact.created', after_data: data, metadata: { source: 'mega_b_prospect_crm' } })

    return NextResponse.json({ ok: true, data }, { status: 201 })
  } catch (error) {
    console.error('[B2B_CONTACT_CREATE_FAILED]', error)
    return NextResponse.json({ ok: false, error: 'Unable to create contact.' }, { status: 500 })
  }
}
