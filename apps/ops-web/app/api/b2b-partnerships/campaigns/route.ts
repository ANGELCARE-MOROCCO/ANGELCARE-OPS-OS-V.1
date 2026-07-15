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

export async function GET() {
  try {
    const g = await guard('read')
    if (!g.ok) return g.response

    const { data, error } = await g.db.from('b2b_campaigns').select('*').order('created_at', { ascending: false })

    if (error) {
      console.error('[B2B_CAMPAIGNS_GET_FAILED]', error)
      return NextResponse.json({ ok: true, data: [] })
    }

    return NextResponse.json({ ok: true, data: data || [] })
  } catch (error) {
    console.error('[B2B_CAMPAIGNS_GET_CRASHED]', error)
    return NextResponse.json({ ok: true, data: [] })
  }
}

export async function POST(req: NextRequest) {
  try {
    const g = await guard('create')
    if (!g.ok) return g.response

    const body = await req.json()
    const payload = {
      name: body.name || 'B2B Campaign',
      segment: body.segment || 'hospitality',
      objective: body.objective || null,
      status: body.status || 'Draft',
      target_count: Number(body.target_count || 0),
      start_at: body.start_at || null,
      end_at: body.end_at || null,
      notes: body.notes || null,
      created_by: g.actor.id,
    }

    const { data, error } = await g.db.from('b2b_campaigns').insert(payload).select('*').single()

    if (error) {
      console.error('[B2B_CAMPAIGNS_POST_FAILED]', error)
      return NextResponse.json({ ok: false, error: 'Unable to create campaign.' }, { status: 500 })
    }

    return NextResponse.json({ ok: true, data }, { status: 201 })
  } catch (error) {
    console.error('[B2B_CAMPAIGNS_POST_CRASHED]', error)
    return NextResponse.json({ ok: false, error: 'Unable to create campaign.' }, { status: 500 })
  }
}
