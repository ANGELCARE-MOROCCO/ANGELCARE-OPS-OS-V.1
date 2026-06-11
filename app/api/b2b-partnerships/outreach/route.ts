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

    const limit = safeLimit(req, 160)
    const { data, error } = await g.db.from('b2b_outreach_logs').select('*').order('sent_at', { ascending: false }).limit(limit)

    if (error) {
      console.error('[B2B_OUTREACH_GET_FAILED]', error)
      return NextResponse.json({ ok: true, data: [] })
    }

    return NextResponse.json({ ok: true, data: data || [] })
  } catch (error) {
    console.error('[B2B_OUTREACH_GET_CRASHED]', error)
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
      contact_id: nullableText(body.contact_id),
      channel: nullableText(body.channel) || 'Email',
      template_key: nullableText(body.template_key),
      subject: nullableText(body.subject),
      message_body: nullableText(body.message_body),
      outcome: nullableText(body.outcome) || 'No response',
      sent_by: g.actor.id,
      sent_at: nullableText(body.sent_at) || new Date().toISOString(),
      next_follow_up_at: nullableText(body.next_follow_up_at),
    }

    const { data, error } = await g.db.from('b2b_outreach_logs').insert(payload).select('*').single()

    if (error) {
      console.error('[B2B_OUTREACH_POST_FAILED]', error)
      return NextResponse.json({ ok: false, error: 'Unable to log outreach.' }, { status: 500 })
    }

    return NextResponse.json({ ok: true, data }, { status: 201 })
  } catch (error) {
    console.error('[B2B_OUTREACH_POST_CRASHED]', error)
    return NextResponse.json({ ok: false, error: 'Unable to log outreach.' }, { status: 500 })
  }
}
