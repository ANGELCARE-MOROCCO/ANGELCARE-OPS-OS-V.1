import { NextRequest, NextResponse } from 'next/server'
import { B2B_AUDIT_ACTIONS } from '@/lib/b2b-partnerships/constants'
import { logB2BActivity, logB2BAuditEvent } from '@/lib/b2b-partnerships/audit'
import { requireB2BPermission } from '@/lib/b2b-partnerships/permissions'
import { getCurrentB2BAppUser, getServerB2BDatabaseClient } from '@/lib/b2b-partnerships/runtime'
import { validateProspectPayload } from '@/lib/b2b-partnerships/validation'

export async function GET(req: NextRequest) {
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

    const url = new URL(req.url)
    const status = url.searchParams.get('status')
    const sector = url.searchParams.get('sector')
    const city = url.searchParams.get('city')
    const owner = url.searchParams.get('owner')
    const q = url.searchParams.get('q')

    let query = db
      .from('b2b_prospects')
      .select('*')
      .is('archived_at', null)
      .order('created_at', { ascending: false })

    if (status) query = query.eq('status', status)
    if (sector) query = query.eq('sector', sector)
    if (city) query = query.ilike('city', `%${city}%`)
    if (owner) query = query.eq('assigned_owner_id', owner)
    if (q) query = query.or(`name.ilike.%${q}%,city.ilike.%${q}%,email.ilike.%${q}%,phone.ilike.%${q}%`)

    const { data, error } = await query

    if (error) {
      return NextResponse.json({ ok: false, error: 'Unable to load B2B prospects.' }, { status: 500 })
    }

    return NextResponse.json({ ok: true, data })
  } catch (error) {
    console.error('[B2B_PROSPECTS_GET_FAILED]', error)
    return NextResponse.json({ ok: false, error: 'Unexpected server error.' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const db = await getServerB2BDatabaseClient()
    const actor = await getCurrentB2BAppUser()

    if (!actor?.id) {
      return NextResponse.json({ ok: false, error: 'Authentication required.' }, { status: 401 })
    }

    const permission = requireB2BPermission('create', {
      actorId: actor.id,
      actorRole: actor.role,
    })

    if (!permission.ok) {
      return NextResponse.json({ ok: false, error: permission.error }, { status: permission.status })
    }

    const body = await req.json()
    const validated = validateProspectPayload(body)

    if (!validated.ok) {
      return NextResponse.json({ ok: false, error: validated.error }, { status: 400 })
    }

    const payload = {
      ...validated.value,
      assigned_owner_id: validated.value.assigned_owner_id ?? actor.id,
      created_by: actor.id,
      updated_by: actor.id,
    }

    const { data, error } = await db
      .from('b2b_prospects')
      .insert(payload)
      .select('*')
      .single()

    if (error) {
      return NextResponse.json({ ok: false, error: 'Unable to create prospect.' }, { status: 500 })
    }

    await logB2BActivity({
      db,
      prospectId: data.id,
      actorId: actor.id,
      activityType: 'prospect.created',
      title: 'B2B prospect created',
      description: `Prospect ${data.name} was created.`,
      metadata: { sector: data.sector, status: data.status },
    })

    await logB2BAuditEvent({
      db,
      actorId: actor.id,
      entityType: 'b2b_prospect',
      entityId: data.id,
      action: B2B_AUDIT_ACTIONS.PROSPECT_CREATED,
      afterData: data,
    })

    return NextResponse.json({ ok: true, data }, { status: 201 })
  } catch (error) {
    console.error('[B2B_PROSPECTS_POST_FAILED]', error)
    return NextResponse.json({ ok: false, error: 'Unexpected server error.' }, { status: 500 })
  }
}
