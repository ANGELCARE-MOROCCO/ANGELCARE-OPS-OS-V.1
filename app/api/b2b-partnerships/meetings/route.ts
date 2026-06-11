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

    const limit = safeLimit(req, 120)
    const { data, error } = await g.db.from('b2b_meetings').select('*').order('scheduled_at', { ascending: true }).limit(limit)

    if (error) {
      console.error('[B2B_MEETINGS_GET_FAILED]', error)
      return NextResponse.json({ ok: true, data: [] })
    }

    return NextResponse.json({ ok: true, data: data || [] })
  } catch (error) {
    console.error('[B2B_MEETINGS_GET_CRASHED]', error)
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
      meeting_type: nullableText(body.meeting_type) || 'Discovery',
      status: nullableText(body.status) || 'Scheduled',
      scheduled_at: nullableText(body.scheduled_at),
      location: nullableText(body.location),
      video_link: nullableText(body.video_link),
      agenda: nullableText(body.agenda),
      notes: nullableText(body.notes),
      next_step: nullableText(body.next_step),
      follow_up_at: nullableText(body.follow_up_at),
      created_by: g.actor.id,
      updated_by: g.actor.id,
    }

    const { data, error } = await g.db.from('b2b_meetings').insert(payload).select('*').single()

    if (error) {
      console.error('[B2B_MEETINGS_POST_FAILED]', error)
      return NextResponse.json({ ok: false, error: 'Unable to create meeting.' }, { status: 500 })
    }

    return NextResponse.json({ ok: true, data }, { status: 201 })
  } catch (error) {
    console.error('[B2B_MEETINGS_POST_CRASHED]', error)
    return NextResponse.json({ ok: false, error: 'Unable to create meeting.' }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const g = await guard('update')
    if (!g.ok) return g.response

    const body = await req.json()
    const id = text(body.id)

    if (!id) {
      return NextResponse.json({ ok: false, error: 'Meeting id is required.' }, { status: 400 })
    }

    const updatePayload: Record<string, unknown> = { updated_by: g.actor.id }
    for (const key of ['meeting_type', 'status', 'scheduled_at', 'location', 'video_link', 'agenda', 'notes', 'needs_identified', 'objections', 'decision_process', 'budget_discussion', 'next_step', 'follow_up_at']) {
      if (body[key] !== undefined) updatePayload[key] = body[key] || null
    }

    const { data, error } = await g.db.from('b2b_meetings').update(updatePayload).eq('id', id).select('*').single()

    if (error) {
      console.error('[B2B_MEETINGS_PATCH_FAILED]', error)
      return NextResponse.json({ ok: false, error: 'Unable to update meeting.' }, { status: 500 })
    }

    return NextResponse.json({ ok: true, data })
  } catch (error) {
    console.error('[B2B_MEETINGS_PATCH_CRASHED]', error)
    return NextResponse.json({ ok: false, error: 'Unable to update meeting.' }, { status: 500 })
  }
}
