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
      permissions: actor.permissions,
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

    const limit = safeLimit(req, 120)
    const { data, error } = await g.db.from('b2b_proposals').select('*').order('created_at', { ascending: false }).limit(limit)

    if (error) {
      console.error('[B2B_PROPOSALS_GET_FAILED]', error)
      return NextResponse.json({ ok: true, data: [] })
    }

    return NextResponse.json({ ok: true, data: data || [] })
  } catch (error) {
    console.error('[B2B_PROPOSALS_GET_CRASHED]', error)
    return NextResponse.json({ ok: true, data: [] })
  }
}

export async function POST(req: NextRequest) {
  try {
    const g = await guard('create')
    if (!g.ok) return g.response

    const body = await req.json()
    const payload = {
      prospect_id: nullableText(body.prospect_id),
      proposal_title: body.proposal_title || body.title || 'Partnership Proposal',
      proposal_type: body.proposal_type || 'B2B partnership',
      services_included: body.services_included || [],
      pricing_model: body.pricing_model || null,
      estimated_monthly_value: body.estimated_monthly_value || 0,
      estimated_annual_value: body.estimated_annual_value || 0,
      pilot_duration: body.pilot_duration || null,
      status: body.status || 'Draft',
      created_by: g.actor.id,
    }

    const { data, error } = await g.db.from('b2b_proposals').insert(payload).select('*').single()

    if (error) {
      console.error('[B2B_PROPOSALS_POST_FAILED]', error)
      return NextResponse.json({ ok: false, error: 'Unable to create proposal.' }, { status: 500 })
    }

    return NextResponse.json({ ok: true, data }, { status: 201 })
  } catch (error) {
    console.error('[B2B_PROPOSALS_POST_CRASHED]', error)
    return NextResponse.json({ ok: false, error: 'Unable to create proposal.' }, { status: 500 })
  }
}
