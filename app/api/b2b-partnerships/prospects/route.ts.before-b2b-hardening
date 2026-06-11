import { NextRequest, NextResponse } from 'next/server'
import { getCurrentB2BAppUser, getServerB2BDatabaseClient } from '@/lib/b2b-partnerships/runtime'
import { requireB2BPermission } from '@/lib/b2b-partnerships/permissions'

async function guard(action: 'read' | 'create' | 'update' = 'read') {
  const db = await getServerB2BDatabaseClient()
  const actor = await getCurrentB2BAppUser()

  if (!actor?.id) {
    return { ok: false as const, db, actor, response: NextResponse.json({ ok: false, error: 'Authentication required.' }, { status: 401 }) }
  }

  const permission = requireB2BPermission(action, {
    actorId: actor.id,
    actorRole: actor.role || actor.role_key,
  })

  if (!permission.ok) {
    return { ok: false as const, db, actor, response: NextResponse.json({ ok: false, error: permission.error }, { status: permission.status }) }
  }

  return { ok: true as const, db, actor }
}

function text(value: unknown, fallback = '') {
  return typeof value === 'string' && value.trim() ? value.trim() : fallback
}

function nullableText(value: unknown) {
  return typeof value === 'string' && value.trim() ? value.trim() : null
}

function safeLimit(req: NextRequest, fallback = 120) {
  const url = new URL(req.url)
  return Math.min(Number(url.searchParams.get('limit') || fallback), 500)
}

export async function GET(req: NextRequest) {
  try {
    const g = await guard('read')
    if (!g.ok) return g.response

    const url = new URL(req.url)
    const limit = safeLimit(req, 120)
    const status = url.searchParams.get('status')
    const sector = url.searchParams.get('sector')
    const priority = url.searchParams.get('priority')
    const q = url.searchParams.get('q')

    let query = g.db.from('b2b_prospects').select('*').is('archived_at', null).order('created_at', { ascending: false }).limit(limit)

    if (status && status !== 'all') query = query.eq('status', status)
    if (sector && sector !== 'all') query = query.eq('sector', sector)
    if (priority && priority !== 'all') query = query.eq('priority_score', priority)

    if (q) {
      query = query.or(`name.ilike.%${q}%,city.ilike.%${q}%,email.ilike.%${q}%,phone.ilike.%${q}%,decision_maker_name.ilike.%${q}%`)
    }

    const { data, error } = await query
    if (error) {
      console.error('[B2B_PROSPECTS_GET_FAILED]', error)
      return NextResponse.json({ ok: true, data: [] })
    }

    return NextResponse.json({ ok: true, data: data || [] })
  } catch (error) {
    console.error('[B2B_PROSPECTS_GET_CRASHED]', error)
    return NextResponse.json({ ok: true, data: [] })
  }
}

export async function POST(req: NextRequest) {
  try {
    const g = await guard('create')
    if (!g.ok) return g.response

    const body = await req.json()
    const name = text(body.name)

    if (!name) {
      return NextResponse.json({ ok: false, error: 'Prospect name is required.' }, { status: 400 })
    }

    const payload = {
      name,
      sector: body.sector || 'Other',
      city: body.city || null,
      phone: body.phone || null,
      email: body.email || null,
      website: body.website || null,
      main_contact_name: body.main_contact_name || null,
      decision_maker_name: body.decision_maker_name || null,
      decision_maker_email: body.decision_maker_email || null,
      decision_maker_phone: body.decision_maker_phone || null,
      status: body.status || 'New',
      priority_score: body.priority_score || 'B',
      relationship_warmth: body.relationship_warmth || 'Cold',
      estimated_monthly_value: body.estimated_monthly_value || 0,
      estimated_annual_value: body.estimated_annual_value || 0,
      next_action: body.next_action || null,
      next_follow_up_at: body.next_follow_up_at || null,
      assigned_owner_id: body.assigned_owner_id || g.actor.id,
      created_by: g.actor.id,
      updated_by: g.actor.id,
    }

    const { data, error } = await g.db.from('b2b_prospects').insert(payload).select('*').single()

    if (error) {
      console.error('[B2B_PROSPECTS_POST_FAILED]', error)
      return NextResponse.json({ ok: false, error: 'Unable to create B2B prospect.' }, { status: 500 })
    }

    return NextResponse.json({ ok: true, data }, { status: 201 })
  } catch (error) {
    console.error('[B2B_PROSPECTS_POST_CRASHED]', error)
    return NextResponse.json({ ok: false, error: 'Unable to create B2B prospect.' }, { status: 500 })
  }
}
